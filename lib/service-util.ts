import * as util from "util";
import * as helpers from "./helpers";

export class ServiceProxyBase implements Server.IServiceProxy {
	private hasVerifiedLatestVersion = false;
	private shouldAuthenticate: boolean = true;

	constructor(protected $httpClient: Server.IHttpClient,
		protected $userDataStore: IUserDataStore,
		protected $logger: ILogger,
		protected $config: IConfiguration,
		protected $staticConfig: IStaticConfig,
		protected $errors: IErrors,
		private $npmService: INpmService) {
	}

	public call<Т>(name: string, method: string, path: string, accept: string, bodyValues: Server.IRequestBodyElement[], resultStream: NodeJS.WritableStream, headers?: any): IFuture<Т> {
		return (() => {
			this.ensureUpToDate().wait();
			headers = headers || Object.create(null);

			let cookies: IStringDictionary;
			if (this.shouldAuthenticate) {
				cookies = this.$userDataStore.getCookies().wait();
				if (cookies) {
					let cookieValues = _.map(_.toPairs(cookies), pair => util.format("%s=%s", pair[0], pair[1]));
					headers.Cookie = cookieValues.join("; ");
				}
			}

			if (accept) {
				headers.Accept = accept;
			}

			let requestOpts: any = {
				proto: this.$config.AB_SERVER_PROTO,
				host: this.$config.AB_SERVER,
				path: `/${path}`,
				method: method,
				headers: headers,
				pipeTo: resultStream
			};

			if (bodyValues) {
				if (bodyValues.length > 1) {
					throw new Error("TODO: CustomFormData not implemented");
				}

				let theBody = bodyValues[0];
				requestOpts.body = theBody.value;
				requestOpts.headers["Content-Type"] = theBody.contentType;
			}

			let response: Server.IResponse;
			try {
				response = this.$httpClient.httpRequest(requestOpts).wait();
			} catch (err) {
				if (err.response && err.response.statusCode === 401) {
					this.$userDataStore.clearLoginData().wait();
				} else if (err.response && err.response.statusCode === 402) {
					this.$errors.fail({ formatStr: "%s", suppressCommandHelp: true }, JSON.parse(err.body).Message);
				}
				throw err;
			}

			this.$logger.debug("%s (%s %s) returned %d", name, method, path, response.response.statusCode);
			let newCookies = response.headers["set-cookie"];

			if (newCookies) {
				this.$userDataStore.parseAndSetCookies(newCookies, cookies);
			}

			let resultValue = accept === "application/json" ? JSON.parse(response.body) : response.body;
			return resultValue;
		}).future<any>()();
	}

	public setShouldAuthenticate(shouldAuthenticate: boolean): void {
		this.shouldAuthenticate = shouldAuthenticate;
	}

	private ensureUpToDate(): IFuture<void> {
		return (() => {
			if (this.$config.ON_PREM || this.hasVerifiedLatestVersion) {
				return;
			}

			this.hasVerifiedLatestVersion = true;
			let latestVersion: string;

			try {
				latestVersion = this.getInformationFromRegistry().wait();
			} catch (error) {
				this.$logger.warn("Failed to retrieve AppBuilder version from npm. Make sure you are running latest version of AppBuilder CLI.");
				this.$logger.trace(`Error is: ${error.message}`);
			}

			if (latestVersion && helpers.versionCompare(latestVersion, this.$staticConfig.version) > 0) {
				this.$errors.fail({ formatStr: "You are running an outdated version of the Telerik AppBuilder CLI. To run this command, you need to update to the latest version of the Telerik AppBuilder CLI. To update now, run 'npm install -g appbuilder'.", suppressCommandHelp: true });
			}
		}).future<void>()();
	}

	private getInformationFromRegistry(): IFuture<string> {
		return (() => {
			let packageJson = this.$npmService.getPackageJsonFromNpmRegistry(this.$staticConfig.CLIENT_NAME.toLowerCase()).wait();

			if (!packageJson) {
				throw new Error("Unable to get information from registry.");
			}

			return packageJson.version;
		}).future<string>()();
	}
}
$injector.register("serviceProxyBase", ServiceProxyBase);

export class AppBuilderServiceProxy extends ServiceProxyBase implements Server.IAppBuilderServiceProxy {
	private solutionSpaceName: string;
	public useSolutionSpaceNameHeader = true;

	constructor(protected $httpClient: Server.IHttpClient,
		protected $userDataStore: IUserDataStore,
		protected $logger: ILogger,
		protected $config: IConfiguration,
		protected $staticConfig: IStaticConfig,
		protected $errors: IErrors,
		$npmService: INpmService) {
		super($httpClient, $userDataStore, $logger, $config, $staticConfig, $errors, $npmService);
	}

	public makeTapServiceCall<T>(call: () => IFuture<T>, solutionSpaceHeaderOptions?: { discardSolutionSpaceHeader: boolean }): IFuture<T> {
		return (() => {
			try {
				let user = this.$userDataStore.getUser().wait();
				this.solutionSpaceName = user.tenant.id;
				if (solutionSpaceHeaderOptions && solutionSpaceHeaderOptions.discardSolutionSpaceHeader) {
					return this.callWithoutSolutionSpaceHeader(call).wait();
				} else {
					return call().wait();
				}
			} finally {
				this.solutionSpaceName = null;
			}
		}).future<T>()();
	}

	private callWithoutSolutionSpaceHeader(action: () => IFuture<any>): IFuture<any> {
		return (() => {
			let cachedUseSolutionSpaceNameValue = this.useSolutionSpaceNameHeader;
			this.useSolutionSpaceNameHeader = false;
			let result: any;
			try {
				result = action().wait();
			} finally {
				this.useSolutionSpaceNameHeader = cachedUseSolutionSpaceNameValue;
			}

			return result;
		}).future<any>()();
	}

	public call<Т>(name: string, method: string, path: string, accept: string, bodyValues: Server.IRequestBodyElement[], resultStream: NodeJS.WritableStream, headers?: any): IFuture<Т> {
		return (() => {
			path = `appbuilder/${path}`;
			headers = headers || Object.create(null);
			if (this.useSolutionSpaceNameHeader) {
				headers["X-Icenium-SolutionSpace"] = this.solutionSpaceName || this.$staticConfig.SOLUTION_SPACE_NAME;
			}
			return super.call<any>(name, method, path, accept, bodyValues, resultStream, headers).wait();
		}).future<any>()();
	}
}
$injector.register("serviceProxy", AppBuilderServiceProxy);

class CodePrinter {
	private indent = "";
	private lines: string[] = [];

	public pushIndent(): void {
		this.indent += "\t";
	}

	public popIndent(): void {
		this.indent = this.indent.substr(1);
	}

	public writeLine(lineFormat?: string, ...args: any[]) {
		if (!lineFormat) {
			this.lines.push("");
		} else {
			if (_.endsWith(lineFormat, "}")) {
				this.popIndent();
				lineFormat += "\r\n";
			}

			args.unshift(lineFormat);
			this.lines.push(this.indent + util.format.apply(null, args));

			if (_.endsWith(lineFormat, "{")) {
				this.pushIndent();
			}
		}
	}

	public toString(): string {
		return this.lines.join("\r\n");
	}
}

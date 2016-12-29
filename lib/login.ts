import * as http from "http";
import * as path from "path";
import * as url from "url";
import Future = require("fibers/future");
import * as helpers from "./helpers";
import * as querystring from "querystring";
import * as cookielib from "cookie";

export class UserDataStore implements IUserDataStore {
	private cookies: IStringDictionary;
	private user: IUser;

	constructor(private $fs: IFileSystem,
		private $config: Config.IConfig,
		private $logger: ILogger,
		private $options: IOptions,
		private $injector: IInjector) { }

	public async hasCookie(): Promise<boolean> {
			try {
				await this.getCookies();
				return true;
			} catch(err) {
				return false;
			}
	}

	public getCookies(): IFuture<IStringDictionary> {
		return this.readAndCache(this.getCookieFilePath(),
			() => this.cookies,
			(value: string) => this.cookies = JSON.parse(value));
	}

	public getUser(): IFuture<IUser> {
		return this.readAndCache(this.getUserStateFilePath(),
			() => this.user,
			(value: string) => this.user = JSON.parse(value));
	}

	public setCookies(cookies?: IStringDictionary): void {
		this.cookies = cookies;
		if(this.cookies) {
			return this.$fs.writeFile(this.getCookieFilePath(), JSON.stringify(this.cookies));
		} else {
			return this.$fs.deleteFile(this.getCookieFilePath());
		}
	}

	public parseAndSetCookies(setCookieHeader: any, cookies?: IStringDictionary): void {
		cookies = cookies || {};
		_.each(setCookieHeader, (cookieStr: string) => {
			let parsed = cookielib.parse(cookieStr);
			_.each(Object.keys(parsed), (key: string) => {
				this.$logger.debug("Stored cookie %s=%s", key, parsed[key]);
				cookies[key] = parsed[key];
			});
		});

		return this.setCookies(cookies);
	}

	public async setUser(user?: IUser): Promise<void> {
			this.user = user;
			if(user) {
				this.$fs.writeJson(this.getUserStateFilePath(), user);
				await this.trackTenantInformation(user);
			} else {
				this.$fs.deleteFile(this.getUserStateFilePath());
			}

	}

	public async clearLoginData(): Promise<void> {
			this.setCookies(null);
			await this.setUser(null);
	}

	private async checkCookieExists<T>(sourceFile: string, getter: () => T): Promise<boolean> {
			return (getter() || this.$fs.exists(sourceFile));
	}

	private async readAndCache<T>(sourceFile: string, getter: () => T, setter: (value: string) => void): Promise<T> {
			if(!getter()) {
				if(! await this.checkCookieExists(sourceFile, getter)) {
					throw new Error("Not logged in.");
				}

				let contents = this.$fs.readText(sourceFile);
				try {
					setter(contents);
				} catch(err) {
					this.$logger.debug("Error while reading user data file '%s':\n%s\n\nContents:\n%s",
						sourceFile, err.toString(), contents);
					await this.clearLoginData();
					throw new Error("Not logged in.");
				}
			}

			return getter();
	}

	private getCookieFilePath(): string {
		return path.join(this.$options.profileDir, this.$config.AB_SERVER + ".cookie");
	}

	private getUserStateFilePath(): string {
		return path.join(this.$options.profileDir, this.$config.AB_SERVER + ".user");
	}

	private async trackTenantInformation(userData: any): Promise<void> {
			if(userData && userData.tenant) {
				let tenantEdition = userData.tenant.editionType || "no-edition";
				let $analyticsService = this.$injector.resolve("analyticsService");
				await $analyticsService.track("UserTenant", tenantEdition);
			}
	}
}
$injector.register("userDataStore", UserDataStore);

export class LoginManager implements ILoginManager {
	public static DEFAULT_NONINTERACTIVE_LOGIN_TIMEOUT_MS = 15 * 60 * 1000;

	constructor(private $logger: ILogger,
		private $config: IConfiguration,
		private $fs: IFileSystem,
		private $userDataStore: IUserDataStore,
		private $opener: IOpener,
		private $server: Server.IServer,
		private $commandsService: ICommandsService,
		private $sharedUserSettingsFileService: IUserSettingsFileService,
		private $httpServer: IHttpServer,
		private $httpClient: Server.IHttpClient,
		private $options: IOptions) { }

	public async logout(): Promise<void> {
			this.$logger.info("Logging out...");

			await this.localLogout();

			let logoutUrl = `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/Mist/Logout`;
			this.$logger.debug("Logout URL is '%s'", logoutUrl);
			this.$opener.open(logoutUrl);

			this.$logger.info("Logout completed.");
	}

	private async localLogout(): Promise<void> {
			await this.$userDataStore.clearLoginData();
			this.$sharedUserSettingsFileService.deleteUserSettingsFile();
	}

	public async login(): Promise<void> {
			await this.localLogout();
			await this.doLogin();
	}

	public isLoggedIn(): IFuture<boolean> {
		return this.$userDataStore.hasCookie();
	}

	public async ensureLoggedIn(): Promise<void> {
			if(! await this.isLoggedIn()) {
				await this.doLogin();
			}
	}

	private async doLogin(): Promise<void> {
			this.$fs.createDirectory(this.$options.profileDir);

			await this.loginInBrowser();

			this.$logger.info("Login completed.");
			await this.$commandsService.tryExecuteCommand("user", []);
	}

	private serveLoginFile(relPath: string): (request: http.ServerRequest, response: http.ServerResponse) => void {
		return this.$httpServer.serveFile(path.join(__dirname, "../resources/login", relPath));
	}

	private async loginInBrowser(): Promise<any> {
			let authComplete = new Future<string>();

			this.$logger.info("Launching login page in browser.");

			let loginUrl: string;
			let localhostServer = this.$httpServer.createServer({
				routes: {
					"/": (request: http.ServerRequest, response: http.ServerResponse) => {
						this.$logger.debug("Login complete: " + request.url);
						let parsedUrl = url.parse(request.url, true);
						let cookieData = parsedUrl.query.cookies;
						if(cookieData) {
							this.serveLoginFile("end.html")(request, response);

							localhostServer.close();

							authComplete.return(cookieData);
						} else {
							this.$httpServer.redirect(response, loginUrl);
						}
					}
				}
			});

			localhostServer.listen(0);
			await this.$fs.futureFromEvent(localhostServer, "listening");

			let port = localhostServer.address().port;
			loginUrl = `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/Mist/ClientLogin?port=${port}&client_name=AppBuilderCLI`;

			this.$logger.debug("Login URL is '%s'", loginUrl);
			this.$opener.open(loginUrl);

			let timeoutID: NodeJS.Timer = undefined;

			if(!helpers.isInteractive()) {

				let timeout = this.$options.hasOwnProperty("timeout")
					? + this.$options.timeout
					: LoginManager.DEFAULT_NONINTERACTIVE_LOGIN_TIMEOUT_MS;

				if(timeout > 0) {
					timeoutID = setTimeout(() => {
						if(!authComplete.isResolved()) {
							this.$logger.debug("Aborting login procedure due to inactivity.");
							process.exit();
						}
					}, timeout);
				}
			}

			let cookieData = await  authComplete;
			if(timeoutID !== undefined) {
				clearTimeout(timeoutID);
			}

			let cookies = JSON.parse(cookieData);
			this.$userDataStore.setCookies(cookies);

			let userData = await  this.$server.authentication.getLoggedInUser();
			await this.$userDataStore.setUser(<any>userData);

			return userData;
	}

	public async telerikLogin(user: string, password: string): Promise<void> {
			let response = this.$httpClient.httpRequest({
				method: "POST",
				url: `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/Mist/Authentication/Login`,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: querystring.stringify({ userName: user, password: password })
			await });

			let cookies = response.headers["set-cookie"];
			if(cookies) {
				this.$userDataStore.parseAndSetCookies(cookies);

				let userData = await  this.$server.authentication.getLoggedInUser();
				await this.$userDataStore.setUser(<any>userData);
			}
	}
}
$injector.register("loginManager", LoginManager);

export class TelerikLoginCommand implements ICommand {
	constructor(private $loginManager: ILoginManager,
		private $stringParameterBuilder: IStringParameterBuilder) { }
	execute(args: string[]): IFuture<void> {
		return (() => {
			await this.$loginManager.telerikLogin(args[0], args[1]);
	}

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password."), this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password.")];

	disableAnalytics = true;
}
$injector.registerCommand("dev-telerik-login", TelerikLoginCommand);

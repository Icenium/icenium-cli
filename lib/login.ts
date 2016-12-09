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

	public hasCookie(): IFuture<boolean> {
		return (() => {
			try {
				this.getCookies().wait();
				return true;
			} catch(err) {
				return false;
			}
		}).future<boolean>()();
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

	public setCookies(cookies?: IStringDictionary): IFuture<void> {
		this.cookies = cookies;
		if(this.cookies) {
			return this.$fs.writeFile(this.getCookieFilePath(), JSON.stringify(this.cookies));
		} else {
			return this.$fs.deleteFile(this.getCookieFilePath());
		}
	}

	public parseAndSetCookies(setCookieHeader: any, cookies?: IStringDictionary): IFuture<void> {
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

	public setUser(user?: IUser): IFuture<void> {
		return (() => {
			this.user = user;
			if(user) {
				this.$fs.writeJson(this.getUserStateFilePath(), user).wait();
				this.trackTenantInformation(user).wait();
			} else {
				this.$fs.deleteFile(this.getUserStateFilePath()).wait();
			}
		}).future<void>()();

	}

	public clearLoginData(): IFuture<void> {
		return (() => {
			this.setCookies(null).wait();
			this.setUser(null).wait();
		}).future<void>()();
	}

	private checkCookieExists<T>(sourceFile: string, getter: () => T): IFuture<boolean> {
		return (() => {
			return (getter() || this.$fs.exists(sourceFile));
		}).future<boolean>()();
	}

	private readAndCache<T>(sourceFile: string, getter: () => T, setter: (value: string) => void): IFuture<T> {
		return (() => {
			if(!getter()) {
				if(!this.checkCookieExists(sourceFile, getter).wait()) {
					throw new Error("Not logged in.");
				}

				let contents = this.$fs.readText(sourceFile).wait();
				try {
					setter(contents);
				} catch(err) {
					this.$logger.debug("Error while reading user data file '%s':\n%s\n\nContents:\n%s",
						sourceFile, err.toString(), contents);
					this.clearLoginData().wait();
					throw new Error("Not logged in.");
				}
			}

			return getter();
		}).future<T>()();
	}

	private getCookieFilePath(): string {
		return path.join(this.$options.profileDir, this.$config.AB_SERVER + ".cookie");
	}

	private getUserStateFilePath(): string {
		return path.join(this.$options.profileDir, this.$config.AB_SERVER + ".user");
	}

	private trackTenantInformation(userData: any): IFuture<void> {
		return (() => {
			if(userData && userData.tenant) {
				let tenantEdition = userData.tenant.editionType || "no-edition";
				let $analyticsService = this.$injector.resolve("analyticsService");
				$analyticsService.track("UserTenant", tenantEdition).wait();
			}
		}).future<void>()();
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

	public logout(): IFuture<void> {
		return (() => {
			this.$logger.info("Logging out...");

			this.localLogout().wait();

			let logoutUrl = `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/Mist/Logout`;
			this.$logger.debug("Logout URL is '%s'", logoutUrl);
			this.$opener.open(logoutUrl);

			this.$logger.info("Logout completed.");
		}).future<void>()();
	}

	private localLogout(): IFuture<void> {
		return (() => {
			this.$userDataStore.clearLoginData().wait();
			this.$sharedUserSettingsFileService.deleteUserSettingsFile().wait();
		}).future<void>()();
	}

	public login(): IFuture<void> {
		return (() => {
			this.localLogout().wait();
			this.doLogin().wait();
		}).future<void>()();
	}

	public isLoggedIn(): IFuture<boolean> {
		return this.$userDataStore.hasCookie();
	}

	public ensureLoggedIn(): IFuture<void> {
		return (() => {
			if(!this.isLoggedIn().wait()) {
				this.doLogin().wait();
			}
		}).future<void>()();
	}

	private doLogin(): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(this.$options.profileDir).wait();

			this.loginInBrowser().wait();

			this.$logger.info("Login completed.");
			this.$commandsService.tryExecuteCommand("user", []).wait();
		}).future<void>()();
	}

	private serveLoginFile(relPath: string): (request: http.ServerRequest, response: http.ServerResponse) => void {
		return this.$httpServer.serveFile(path.join(__dirname, "../resources/login", relPath));
	}

	private loginInBrowser(): IFuture<any> {
		return (() => {
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
			this.$fs.futureFromEvent(localhostServer, "listening").wait();

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

			let cookieData = authComplete.wait();
			if(timeoutID !== undefined) {
				clearTimeout(timeoutID);
			}

			let cookies = JSON.parse(cookieData);
			this.$userDataStore.setCookies(cookies).wait();

			let userData = this.$server.authentication.getLoggedInUser().wait();
			this.$userDataStore.setUser(<any>userData).wait();

			return userData;
		}).future()();
	}

	public telerikLogin(user: string, password: string): IFuture<void> {
		return (() => {
			let response = this.$httpClient.httpRequest({
				method: "POST",
				url: `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/Mist/Authentication/Login`,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: querystring.stringify({ userName: user, password: password })
			}).wait();

			let cookies = response.headers["set-cookie"];
			if(cookies) {
				this.$userDataStore.parseAndSetCookies(cookies).wait();

				let userData = this.$server.authentication.getLoggedInUser().wait();
				this.$userDataStore.setUser(<any>userData).wait();
			}
		}).future<void>()();
	}
}
$injector.register("loginManager", LoginManager);

export class TelerikLoginCommand implements ICommand {
	constructor(private $loginManager: ILoginManager,
		private $stringParameterBuilder: IStringParameterBuilder) { }
	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.telerikLogin(args[0], args[1]).wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password."), this.$stringParameterBuilder.createMandatoryParameter("Missing user name or password.")];

	disableAnalytics = true;
}
$injector.registerCommand("dev-telerik-login", TelerikLoginCommand);

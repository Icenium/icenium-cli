///<reference path=".d.ts"/>
"use strict";
import http = require("http");
import util = require("util");
import path = require("path");
import url = require("url");
import options = require("./options");
import Future = require("fibers/future");
import helpers = require("./helpers");
import querystring = require("querystring");
import cookielib = require("cookie");
import commandParams = require("./common/command-params");

export class UserDataStore implements IUserDataStore {
	private cookies: IStringDictionary;
	private user: any;

	constructor(private $fs: IFileSystem,
		private $config: Config.IConfig,
		private $logger: ILogger) { }

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

	public getUser(): IFuture<any> {
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
			var parsed = cookielib.parse(cookieStr);
			_.each(Object.keys(parsed), (key: string) => {
				this.$logger.debug("Stored cookie %s=%s", key, parsed[key]);
				cookies[key] = parsed[key];
			});
		});

		return this.setCookies(cookies);
	}

	public setUser(user?: any): IFuture<void> {
		this.user = user;
		if(user) {
			return this.$fs.writeJson(this.getUserStateFilePath(), user);
		} else {
			return this.$fs.deleteFile(this.getUserStateFilePath());
		}
	}

	public clearLoginData(): IFuture<void> {
		return (() => {
			this.setCookies(null).wait();
			this.setUser(null).wait();
		}).future<void>()();
	}

	private checkCookieExists<T>(sourceFile: string, getter: () => T): IFuture<boolean> {
		return (() => {
			return (getter() || this.$fs.exists(sourceFile).wait());
		}).future<boolean>()();
	}

	private readAndCache<T>(sourceFile: string, getter: () => T, setter: (value: string) => void): IFuture<T> {
		return (() => {
			if(!getter()) {
				if(!this.checkCookieExists(sourceFile, getter).wait()) {
					throw new Error("Not logged in.");
				}

				var contents = this.$fs.readText(sourceFile).wait();
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
		return path.join(options["profile-dir"], this.$config.AB_SERVER + ".cookie");
	}

	private getUserStateFilePath(): string {
		return path.join(options["profile-dir"], this.$config.AB_SERVER + ".user");
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
		private $httpClient: Server.IHttpClient) { }

	public logout(): IFuture<void> {
		return (() => {
			this.$logger.info("Logging out...");

			this.localLogout().wait();

			var logoutUrl = util.format("%s://%s/appbuilder/Mist/Logout", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
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
			this.$fs.createDirectory(options["profile-dir"]).wait();

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
			var authComplete = new Future<string>();

			this.$logger.info("Launching login page in browser.");

			var localhostServer = this.$httpServer.createServer({
				routes: {
					"/": (request: http.ServerRequest, response: http.ServerResponse) => {
						this.$logger.debug("Login complete: " + request.url);
						var parsedUrl = url.parse(request.url, true);
						var cookieData = parsedUrl.query.cookies;
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

			var port = localhostServer.address().port;
			var loginUrl = util.format("%s://%s/appbuilder/Mist/ClientLogin?port=%s&client_name=AppBuilderCLI", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER, port);

			this.$logger.debug("Login URL is '%s'", loginUrl);
			this.$opener.open(loginUrl);

			var timeoutID: Timer = undefined;

			if(!helpers.isInteractive()) {
				var timeout = options.hasOwnProperty("timeout")
					? +options.timeout
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

			var cookieData = authComplete.wait();
			if(timeoutID !== undefined) {
				clearTimeout(timeoutID);
			}

			var cookies = JSON.parse(cookieData);
			this.$userDataStore.setCookies(cookies).wait();

			var userData = this.$server.authentication.getLoggedInUser().wait();
			this.$userDataStore.setUser(userData).wait();

			return userData;
		}).future()();
	}

	public telerikLogin(user: string, password: string): IFuture<void> {
		return (() => {
			var response = this.$httpClient.httpRequest({
				method: "POST",
				url: util.format("%s://%s/appbuilder/Mist/Authentication/Login", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: querystring.stringify({ userName: user, password: password })
			}).wait();

			var cookies = response.headers["set-cookie"];
			if(cookies) {
				this.$userDataStore.parseAndSetCookies(cookies).wait();

				var userData = this.$server.authentication.getLoggedInUser().wait();
				this.$userDataStore.setUser(userData).wait();
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

///<reference path=".d.ts"/>

"use strict";

import util = require("util");
import path = require("path");
import url = require("url");
import fileSrv = require("./http-server");
import options = require("./options");
import querystring = require("querystring");
import Future = require("fibers/future");
import helpers = require("./helpers");

export class UserDataStore implements IUserDataStore {
	private cookie: string;
	private user: any;

	constructor(private $fs: IFileSystem) {
	}

	public hasCookie(): IFuture<boolean> {
		return this.checkCookieExists(UserDataStore.getCookieFilePath(), () => this.cookie);
	}

	public getCookie(): IFuture<string> {
		return this.readAndCache(UserDataStore.getCookieFilePath(),
			() => this.cookie,
			(value: string) => this.cookie = value);
	}

	public getUser(): IFuture<any> {
		return this.readAndCache(UserDataStore.getUserStateFilePath(),
			() => this.user,
			(value: string) => this.user = JSON.parse(value));
	}

	public setCookie(cookie?: string): IFuture<void> {
		this.cookie = cookie;
		if (cookie) {
			return this.$fs.writeFile(UserDataStore.getCookieFilePath(), cookie);
		} else {
			return this.$fs.deleteFile(UserDataStore.getCookieFilePath());
		}
	}

	public setUser(user?: any): IFuture<void> {
		this.user = user;
		if (user) {
			return this.$fs.writeJson(UserDataStore.getUserStateFilePath(), user);
		} else {
			return this.$fs.deleteFile(UserDataStore.getUserStateFilePath());
		}
	}

	private checkCookieExists<T>(sourceFile: string, getter: () => T) : IFuture<boolean> {
		return (() => {
			return (getter() || this.$fs.exists(sourceFile).wait());
		}).future<boolean>()();
	}

	private readAndCache<T>(sourceFile: string, getter: () => T, setter: (value: string) => void): IFuture<T> {
		return (() => {
			if (!getter()) {
				if (!this.checkCookieExists(sourceFile, getter).wait()) {
					throw new Error("Not logged in.");
				}

				setter(this.$fs.readText(sourceFile).wait());
			}

			return getter();
		}).future<T>()();
	}

	private static getCookieFilePath(): string {
		return path.join(options["profile-dir"], "cookie");
	}

	private static getUserStateFilePath(): string {
		return path.join(options["profile-dir"], "user");
	}
}
$injector.register("userDataStore", UserDataStore);

export class LoginManager implements ILoginManager {
	constructor(private $logger: ILogger,
		private $config: IConfiguration,
		private $serverConfiguration: IServerConfiguration,
		private $httpClient: Server.IHttpClient,
		private $server: Server.IServer,
		private $serviceProxy: Server.IServiceProxy,
		private $fs: IFileSystem,
		private $userDataStore: IUserDataStore,
		private $opener: IOpener,
		private $commandsService: ICommandsService,
		private $sharedUserSettingsService: IUserSettingsService) { }

	public basicLogin(userName: string, password: string): IFuture<void> {
		var loginData = {
			wrap_username: userName,
			wrap_password: password
		};

		return this.authenticate(loginData);
	}

	public logout(): IFuture<void> {
		return (() => {
			this.$logger.info("Logging out...");

			this.$userDataStore.setCookie(null).wait();
			this.$userDataStore.setUser(null).wait();

			this.$sharedUserSettingsService.deleteUserSettingsFile().wait();

			this.$logger.info("Logout completed.");
		}).future<void>()();
	}

	public login(): IFuture<void> {
		return (() => {
			this.logout().wait();

			this.doLogin().wait();
		}).future<void>()();
	}

	public isLoggedIn() : IFuture<boolean> {
		return this.$userDataStore.hasCookie();
	}

	public ensureLoggedIn(): IFuture<void> {
		return (() => {
			if (!this.isLoggedIn().wait()) {
				this.doLogin().wait();
			}
		}).future<void>()();
	}

	private doLogin(): IFuture<void> {
		return (() => {
			this.$fs.createDirectory(options["profile-dir"]).wait();

			this.loginInBrowser().wait();

			this.$logger.info("Login completed.");
			this.$commandsService.executeCommand("user", []);
		}).future<void>()();
	}

	private authenticate(loginData: any): IFuture<any> {
		return ((): any => {
			loginData.wrap_client_id = this.$config.WRAP_CLIENT_ID;

			var wrapResponse = this.$httpClient.httpRequest({
				proto: "https",
				host: this.$serverConfiguration.tfisServer.wait(),
				path: "/Authenticate/WRAPv0.9",
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: querystring.stringify(loginData)
			}).wait();

			var wrapData = querystring.parse(wrapResponse.body),
				wrap_access_token = wrapData.wrap_access_token;

			this.$serviceProxy.setShouldAuthenticate(false);
			var userData = this.$server.authentication.login(wrap_access_token).wait();
			this.$serviceProxy.setShouldAuthenticate(true);

			var cookies = this.$serviceProxy.getLastRequestCookies();
			var abAuthCookie = cookies && cookies[".ASPXAUTH"];
			this.$logger.debug("Cookie is '%s'", abAuthCookie);

			if (abAuthCookie && userData) {
				this.$userDataStore.setCookie(abAuthCookie).wait();
				this.$userDataStore.setUser(userData).wait();
			} else {
				throw new Error("Login failed.");
			}

			return userData;
		}).future()();
	}

	private static serveLoginFile(relPath): (request, response) => void {
		return fileSrv.serveFile(path.join(__dirname, "../resources/login", relPath));
	}

	private loginInBrowser(): IFuture<any> {
		return (() => {
			var authComplete = new Future();

			this.$logger.info("Launching login page in browser.");

			var localhostServer = fileSrv.createServer({
				routes: {
					"/completeLogin": (request, response) => {
						var code = url.parse(request.url, true).query.wrap_verification_code;
						this.$logger.debug("Verification code: '%s'", code);
						if (code) {
							LoginManager.serveLoginFile("end.html")(request, response);

							this.$logger.debug("Login complete: " + request.url);
							localhostServer.close();

							authComplete.return(code);
						} else {
							fileSrv.redirect(response, loginUrl);
						}
					}
				}
			});

			localhostServer.listen(0);
			this.$fs.futureFromEvent(localhostServer, "listening").wait();

			var port = localhostServer.address().port;

			var queryParams = {
				wrap_client_id: this.$config.WRAP_CLIENT_ID,
				wrap_callback: util.format("http://localhost:%s/completeLogin", port)
			};
			var loginUrl = util.format("https://%s/Authenticate/WRAPv0.9?%s",
				this.$serverConfiguration.tfisServer.wait(),
				querystring.stringify(queryParams));

			this.$logger.debug("Login URL is '%s'", loginUrl);
			this.$opener.open(loginUrl);

			var code = authComplete.wait();
			return this.authenticate({ wrap_verification_code: code }).wait();
		}).future()();
	}
}
$injector.register("loginManager", LoginManager);
helpers.registerCommand("loginManager", "login", (loginManager, args) => loginManager.login());
helpers.registerCommand("loginManager", "logout", (loginManager, args) => loginManager.logout());
helpers.registerCommand("loginManager", "dev-telerik-login", (loginManager, args) => loginManager.basicLogin(args[0], args[1]));
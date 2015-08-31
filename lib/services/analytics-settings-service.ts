///<reference path="../.d.ts"/>
"use strict";

export class AnalyticsSettingsService implements IAnalyticsSettingsService {
	constructor(private $loginManager: ILoginManager,
		private $userDataStore: IUserDataStore,
		private $staticConfig: IStaticConfig) { }

	public canDoRequest(): IFuture<boolean> {
		return this.$loginManager.isLoggedIn();
	}

	public getUserId(): IFuture<string> {
		return (() => {
			return this.$userDataStore.getUser().wait().id;
		}).future<string>()();
	}

	public getClientName(): string {
		return "Telerik".white.bold + " " + this.$staticConfig.CLIENT_NAME.cyan.bold;
	}

	public getPrivacyPolicyLink(): string {
		return "http://www.telerik.com/company/privacy-policy";
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);

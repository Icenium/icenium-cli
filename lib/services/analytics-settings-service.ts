export class AnalyticsSettingsService implements IAnalyticsSettingsService {
	constructor(private $loginManager: ILoginManager,
		private $userDataStore: IUserDataStore,
		private $staticConfig: IStaticConfig,
		private $userSettingsService: IUserSettingsService) { }

	public canDoRequest(): IFuture<boolean> {
		return this.$loginManager.isLoggedIn();
	}

	public getUserId(): IFuture<string> {
		return (() => {
			return this.$userDataStore.getUser().wait().uid;
		}).future<string>()();
	}

	public getClientName(): string {
		return "Telerik".white.bold + " " + this.$staticConfig.CLIENT_NAME.cyan.bold;
	}

	public getPrivacyPolicyLink(): string {
		return "http://www.telerik.com/company/privacy-policy";
	}

	public getUserSessionsCount(): IFuture<number> {
		return (() => {
			return this.$userSettingsService.getSettingValue<number>("SESSIONS_STARTED").wait() || 0;
		}).future<number>()();
	}

	public setUserSessionsCount(count: number): IFuture<void> {
		return this.$userSettingsService.saveSetting<number>("SESSIONS_STARTED", count);
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);

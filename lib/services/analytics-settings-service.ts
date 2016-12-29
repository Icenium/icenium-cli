export class AnalyticsSettingsService implements IAnalyticsSettingsService {
	constructor(private $loginManager: ILoginManager,
		private $userDataStore: IUserDataStore,
		private $staticConfig: IStaticConfig,
		private $userSettingsService: IUserSettingsService) { }

	public canDoRequest(): IFuture<boolean> {
		return this.$loginManager.isLoggedIn();
	}

	public async getUserId(): Promise<string> {
			return this.$userDataStore.getUser().wait().uid;
	}

	public getClientName(): string {
		return "Telerik".white.bold + " " + this.$staticConfig.CLIENT_NAME.cyan.bold;
	}

	public getPrivacyPolicyLink(): string {
		return "http://www.telerik.com/company/privacy-policy";
	}

	public async getUserSessionsCount(): Promise<number> {
			return this.$userSettingsService.getSettingValue<number>("SESSIONS_STARTED").wait() || 0;
	}

	public setUserSessionsCount(count: number): IFuture<void> {
		return this.$userSettingsService.saveSetting<number>("SESSIONS_STARTED", count);
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);

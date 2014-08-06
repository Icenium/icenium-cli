///<reference path="../.d.ts"/>

export class AnalyticsSettingsService implements IAnalyticsSettingsService {
	constructor(private $loginManager: ILoginManager,
		private $userDataStore: IUserDataStore) { }

	public canRequestConsent(): IFuture<boolean> {
		return this.$loginManager.isLoggedIn();
	}

	public getUserId(): IFuture<string> {
		return this.$userDataStore.getUser();
	}
}
$injector.register("analyticsSettingsService", AnalyticsSettingsService);
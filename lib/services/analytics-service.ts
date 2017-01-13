import { AnalyticsServiceBase } from "../common/services/analytics-service-base";

export class AnalyticsService extends AnalyticsServiceBase implements IAnalyticsService {
	private static SUBLIME_ANALYTICS_CLIENT_NAME = "Sublime";
	private static SUBLIME_ANALYTICS_PROJECT_KEY = "0e2863c76b76409fa7bc140a2b36a066";

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		$staticConfig: Config.IStaticConfig,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$progressIndicator: IProgressIndicator,
		$osInfo: IOsInfo) {
		super($logger, $options, $staticConfig, $prompter, $userSettingsService, $analyticsSettingsService, $progressIndicator, $osInfo);
	}

	public async trackFeature(featureName: string): Promise<void> {
		if (this.$options.analyticsClient === AnalyticsService.SUBLIME_ANALYTICS_CLIENT_NAME) {
			await super.restartEqatecMonitor(AnalyticsService.SUBLIME_ANALYTICS_PROJECT_KEY);
		}

		await super.trackFeature(featureName);
	}
}

$injector.register("analyticsService", AnalyticsService);

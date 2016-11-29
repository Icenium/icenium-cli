import {AnalyticsServiceBase} from "../common/services/analytics-service-base";

export class AnalyticsService extends AnalyticsServiceBase implements IAnalyticsService {
	private static SUBLIME_ANALYTICS_CLIENT_NAME = "Sublime";
	private static SUBLIME_ANALYTICS_PROJECT_KEY = "0e2863c76b76409fa7bc140a2b36a066";

	constructor(protected $logger: ILogger,
		protected $options: IOptions,
		$staticConfig: Config.IStaticConfig,
		$errors: IErrors,
		$prompter: IPrompter,
		$userSettingsService: UserSettings.IUserSettingsService,
		$analyticsSettingsService: IAnalyticsSettingsService,
		$progressIndicator: IProgressIndicator,
		$osInfo: IOsInfo) {
		super($logger, $options, $staticConfig, $errors, $prompter, $userSettingsService, $analyticsSettingsService, $progressIndicator, $osInfo);
	}

	public trackFeature(featureName: string): IFuture<void> {
		return (() => {
			if (this.$options.analyticsClient === AnalyticsService.SUBLIME_ANALYTICS_CLIENT_NAME) {
				super.restartEqatecMonitor(AnalyticsService.SUBLIME_ANALYTICS_PROJECT_KEY).wait();
			}

			super.trackFeature(featureName).wait();
		}).future<void>()();
	}
}

$injector.register("analyticsService", AnalyticsService);

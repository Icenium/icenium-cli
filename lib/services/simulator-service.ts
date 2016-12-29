import {EOL} from "os";

export class SimulatorService implements ISimulatorService {
	private simulatorPath: string;

	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $loginManager: ILoginManager,
		private $projectMigrationService: Project.IProjectMigrationService,
		private $processInfo: IProcessInfo,
		private $project: Project.IProject,
		private $projectSimulatorService: IProjectSimulatorService,
		private $serverExtensionsService: IServerExtensionsService,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		private $staticConfig: IStaticConfig,
		private $analyticsService: IAnalyticsService) {
	}

	public launchSimulator(): IFuture<void> {
		await this.$loginManager.ensureLoggedIn();

		let simulatorPackageName = this.$simulatorPlatformServices.packageName;
		this.simulatorPath = this.$serverExtensionsService.getExtensionPath(simulatorPackageName);
		await this.$serverExtensionsService.prepareExtension(simulatorPackageName, this.ensureSimulatorIsNotRunning.bind(this));

		this.$project.ensureAllPlatformAssets();
		await this.$projectMigrationService.migrateTypeScriptProject();
		return this.runSimulator(simulatorPackageName);
	}

	private async ensureSimulatorIsNotRunning(): Promise<void> {
			this.$logger.info(); // HACK - display simulator downloading indicator correctly
			let isRunning = await  this.$processInfo.isRunning(this.$simulatorPlatformServices.executableName);
			if (isRunning) {
				this.$errors.failWithoutHelp("AppBuilder Simulator is currently running and cannot be updated." + EOL +
					"Close it and run $ appbuilder simulate again.");
			}
	}

	private async runSimulator(simulatorPackageName: string): Promise<void> {
			this.$logger.info("Starting simulator...");

			let simulatorParams = [
				"--path", this.$project.getProjectDir(),
				"--assemblypaths", this.simulatorPath,
				"--analyticsaccountcode", this.$staticConfig.ANALYTICS_API_KEY
			];

			await if(this.$analyticsService.isEnabled(this.$staticConfig.TRACK_FEATURE_USAGE_SETTING_NAME)) {
				simulatorParams.push("--trackfeatureusage");
			}

			await if(this.$analyticsService.isEnabled(this.$staticConfig.ERROR_REPORT_SETTING_NAME)) {
				simulatorParams.push("--trackexceptions");
			}

			simulatorParams = await  simulatorParams.concat(this.$projectSimulatorService.getSimulatorParams(simulatorPackageName));
			this.$simulatorPlatformServices.runApplication(this.simulatorPath, simulatorParams);
	}
}
$injector.register("simulatorService", SimulatorService);

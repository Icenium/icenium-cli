///<reference path="../.d.ts"/>
"use strict";

import os = require("os");

export class SimulatorService implements ISimulatorService {
	private simulatorPath: string;
	
	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $loginManager: ILoginManager,
		private $platformMigrator: Project.IPlatformMigrator,
		private $processInfo: IProcessInfo,
		private $project: Project.IProject,
		private $projectSimulatorService: IProjectSimulatorService,
		private $serverExtensionsService: IServerExtensionsService,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		private $staticConfig: IStaticConfig,
		private $analyticsService: IAnalyticsService) {
	}

	public launchSimulator(): IFuture<void> {
		this.$loginManager.ensureLoggedIn().wait();

		let simulatorPackageName = this.$simulatorPlatformServices.getPackageName();
		this.simulatorPath = this.$serverExtensionsService.getExtensionPath(simulatorPackageName);
		this.$serverExtensionsService.prepareExtension(simulatorPackageName, this.ensureSimulatorIsNotRunning.bind(this)).wait();

		this.$platformMigrator.ensureAllPlatformAssets().wait();

		return this.runSimulator(simulatorPackageName);
	}

	private ensureSimulatorIsNotRunning(): IFuture<void> {
		return (() => {
			this.$logger.info(); // HACK - display simulator downloading indicator correctly
			let isRunning = this.$processInfo.isRunning(this.$simulatorPlatformServices.executableName).wait();
			if (isRunning) {
				this.$errors.failWithoutHelp("AppBuilder Simulator is currently running and cannot be updated." + os.EOL +
					"Close it and run $ appbuilder simulate again.");
			}
		}).future<void>()();
	}

	private runSimulator(simulatorPackageName: string): IFuture<void> {
		return (() => {
			this.$logger.info("Starting simulator...");

			let simulatorParams = [
				"--path", this.$project.getProjectDir().wait(),
				"--assemblypaths", this.simulatorPath,
				"--isfeaturetrackingenabled", this.$analyticsService.isEnabled().wait().toString(),
				"--analyticsaccountcode", this.$staticConfig.ANALYTICS_API_KEY
			];

			simulatorParams = simulatorParams.concat(this.$projectSimulatorService.getSimulatorParams(simulatorPackageName).wait());

			this.$simulatorPlatformServices.runApplication(this.simulatorPath, simulatorParams);
		}).future<void>()();
	}
}
$injector.register("simulatorService", SimulatorService);

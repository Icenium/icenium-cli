///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import path = require("path");
import Future = require("fibers/future");
import hostInfo = require("../host-info");
import commonHostInfo = require("../common/host-info");

export class SimulateCommand implements ICommand {
	private static PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";
	private static PLUGINS_API_CONTRACT: string = "/appbuilder/api/cordova/plugins/package";

	private projectData: IProjectData;
	private pluginsPath: string;
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
			this.projectData = $project.projectData;
		}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			if (!this.$project.capabilities.simulate) {
				this.$errors.fail("You cannot run %s based projects in the device simulator.", this.$project.projectData.Framework);
			}

			if(!hostInfo.hostCapabilities[process.platform].debugToolsSupported) {
				this.$errors.fail("In this version of the Telerik AppBuilder CLI, you cannot run the device simulator on Linux. The device simulator for Linux will become available in a future release of the Telerik AppBuilder CLI.");
			}

			this.$loginManager.ensureLoggedIn().wait();

			var simulatorPackageName = this.$simulatorPlatformServices.getPackageName();
			this.simulatorPath = this.$serverExtensionsService.getExtensionPath(simulatorPackageName);
			this.$serverExtensionsService.prepareExtension(simulatorPackageName, this.ensureSimulatorIsNotRunning.bind(this)).wait();

			this.$platformMigrator.ensureAllPlatformAssets().wait();

			this.runSimulator(simulatorPackageName).wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return this.$simulatorPlatformServices.canRunApplication();
	}

	private ensureSimulatorIsNotRunning(): void {
		var isRunning = this.$processInfo.isRunning(this.$simulatorPlatformServices.executableName).wait();
		if (isRunning) {
			this.$errors.fail({formatStr: "AppBuilder Simulator is currently running and cannot be updated." + os.EOL +
				"Close it and run $ appbuilder simulate again.", suppressCommandHelp: true});
		}
	}

	private runSimulator(simulatorPackageName: string): IFuture<void> {
		return (() => {
			this.$logger.info("Starting simulator...");

			var simulatorParams = [
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
$injector.registerCommand("simulate", SimulateCommand);

class WinSimulatorPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Tools.Package";
	private static EXECUTABLE_NAME_WIN = "Icenium.Simulator.exe";

	constructor(private $childProcess: IChildProcess,
				private $errors: IErrors) { }

	public getPackageName(): string {
		return WinSimulatorPlatformServices.PACKAGE_NAME_WIN;
	}

	public get executableName(): string {
		return WinSimulatorPlatformServices.EXECUTABLE_NAME_WIN;
	}

	public runApplication(applicationPath: string, applicationParams: string[]) {
		var simulatorBinary = path.join(applicationPath, WinSimulatorPlatformServices.EXECUTABLE_NAME_WIN);
		this.$childProcess.spawn(simulatorBinary, applicationParams,
			{ stdio: "ignore", detached: true }).unref();
	}

	public canRunApplication(): IFuture<boolean> {
		return hostInfo.isDotNet40Installed("Unable to start the simulator. Verify that you have installed .NET 4.0 or later and try again.");
	}
}

class MacSimulatorPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_MAC: string = "Telerik.BlackDragon.Client.Mobile.Tools.Mac.Package";
	private static EXECUTABLE_NAME_MAC = "AppBuilder Simulator";
	private static EXECUTABLE_NAME_MAC_APP = MacSimulatorPlatformServices.EXECUTABLE_NAME_MAC + ".app";

	constructor(private $childProcess: IChildProcess) { }

	public getPackageName() : string {
		return MacSimulatorPlatformServices.PACKAGE_NAME_MAC;
	}

	public get executableName(): string {
		return MacSimulatorPlatformServices.EXECUTABLE_NAME_MAC;
	}

	public runApplication(applicationPath: string, applicationParams: string[]) {
		var simulatorBinary = path.join(applicationPath, MacSimulatorPlatformServices.EXECUTABLE_NAME_MAC_APP);
		var commandLine = [simulatorBinary, '--args'].concat(applicationParams);
		this.$childProcess.spawn('open', commandLine,
			{ stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
	}

	public canRunApplication(): IFuture<boolean> {
		return (() => true).future<boolean>()();
	}
}

if(commonHostInfo.isWindows()) {
	$injector.register("simulatorPlatformServices", WinSimulatorPlatformServices);
} else if(commonHostInfo.isDarwin()) {
	$injector.register("simulatorPlatformServices", MacSimulatorPlatformServices);
} else {
	$injector.register("simulatorPlatformServices", {});
}

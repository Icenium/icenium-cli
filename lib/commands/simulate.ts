///<reference path="../.d.ts"/>
"use strict";
import child_process = require("child_process");
import path = require("path");
import Future = require("fibers/future");
import helpers = require("../helpers");
import MobileHelper = require("../common/mobile/mobile-helper");
import hostInfo = require("../host-info");

export class SimulateCommand implements ICommand {
	private static PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";
	private static PLUGINS_API_CONTRACT: string = "/appbuilder/api/cordova/plugins/package";

	private projectData: IProjectData;
	private pluginsPath: string;
	private simulatorPath: string;

	constructor(private $logger: ILogger,
		private $fs: IFileSystem,
		private $config: IConfiguration,
		private $server: Server.IServer,
		private $project: Project.IProject,
		private $loginManager: ILoginManager,
		private $platformMigrator: Project.IPlatformMigrator,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		private $serverExtensionsService: IServerExtensionsService,
		private $errors: IErrors) {
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
			this.$serverExtensionsService.prepareExtension(simulatorPackageName).wait();
			this.prepareCordovaPlugins(simulatorPackageName).wait();
			this.$platformMigrator.ensureAllPlatformAssets().wait();

			this.runSimulator().wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];

	private prepareCordovaPlugins(simulatorPackageName: string): IFuture<void> {
		return (() => {
			var packageVersion = this.$serverExtensionsService.getExtensionVersion(simulatorPackageName);
			this.pluginsPath = path.join(this.$serverExtensionsService.cacheDir, this.getPluginsDirName(packageVersion));

			var pluginsApiEndpoint = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + SimulateCommand.PLUGINS_API_CONTRACT;

			if (!this.$fs.exists(this.pluginsPath).wait()) {
				try {
					this.$logger.info("Downloading core Cordova plugins...");

					this.$fs.createDirectory(this.pluginsPath).wait();
					var zipPath = path.join(this.pluginsPath, "plugins.zip");

					this.$logger.debug("Downloading Cordova plugins package into '%s'", zipPath);
					var zipFile = this.$fs.createWriteStream(zipPath);
					this.$server.cordova.getPluginsPackage(zipFile).wait();

					this.$logger.debug("Unpacking Cordova plugins from %s", zipPath);
					this.$fs.unzip(zipPath, this.pluginsPath).wait();

					this.$logger.info("Finished downloading plugins.");
				} catch(err) {
					this.$fs.deleteDirectory(this.pluginsPath).wait();
					throw err;
				}
			}
		}).future<void>()();
	}

	private runSimulator(): IFuture<void> {
		return (() => {
			this.$logger.info("Starting simulator...");

			var projectTargets = this.$project.projectTargets.wait().join(";");

			var simulatorParams = [
				"--path", this.$project.getProjectDir().wait(),
				"--statusbarstyle", this.projectData.iOSStatusBarStyle,
				"--frameworkversion", this.projectData.FrameworkVersion,
				"--orientations", this.projectData.DeviceOrientations.join(";"),
				"--assemblypaths", this.simulatorPath,
				"--corepluginspath", this.pluginsPath,
				"--supportedplatforms", projectTargets,
				"--plugins", this.projectData.CorePlugins.join(";")
			];

			this.$simulatorPlatformServices.runApplication(this.simulatorPath, simulatorParams);
		}).future<void>()();
	}

	private getPluginsDirName(serverVersion: string) {
		var result: string;
		if (this.$config.DEBUG) {
			result = SimulateCommand.PLUGINS_PACKAGE_IDENTIFIER;
		} else {
			result = SimulateCommand.PLUGINS_PACKAGE_IDENTIFIER + "-" + serverVersion;
		}
		this.$logger.debug("PLUGINS dir is: " + result);
		return result;
	}
}
$injector.registerCommand("simulate", SimulateCommand);

class WinSimulatorPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Tools.Package";
	private static EXECUTABLE_NAME_WIN = "Icenium.Simulator.exe";

	constructor(private $childProcess: IChildProcess) {
	}

	public getPackageName(): string {
		return WinSimulatorPlatformServices.PACKAGE_NAME_WIN;
	}

	public runApplication(applicationPath: string, applicationParams: string[]) {
		var simulatorBinary = path.join(applicationPath, WinSimulatorPlatformServices.EXECUTABLE_NAME_WIN);
		this.$childProcess.spawn(simulatorBinary, applicationParams,
			{ stdio: ["ignore", "ignore", "ignore"], detached: true }).unref();
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

	public runApplication(applicationPath: string, applicationParams: string[]) {
		var simulatorBinary = path.join(applicationPath, MacSimulatorPlatformServices.EXECUTABLE_NAME_MAC_APP);
		var commandLine = [simulatorBinary, '--args'].concat(applicationParams);
		this.$childProcess.spawn('open', commandLine,
			{ stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
	}
}

if (hostInfo.isWindows()) {
	$injector.register("simulatorPlatformServices", WinSimulatorPlatformServices);
} else if (hostInfo.isDarwin()) {
	$injector.register("simulatorPlatformServices", MacSimulatorPlatformServices);
} else {
	$injector.register("simulatorPlatformServices", {});
}

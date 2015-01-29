///<reference path="../.d.ts"/>
"use strict";

import path = require("path");

export class ProjectSimulatorService implements IProjectSimulatorService {

	constructor(private $frameworkSimulatorServiceResolver: Project.IFrameworkSimulatorServiceResolver,
		private $project: Project.IProject) { }

	private get frameworkProjectSimulatorService(): IProjectSimulatorService {
		return this.$frameworkSimulatorServiceResolver.resolve(this.$project.projectData.Framework);
	}

	public getSimulatorParams(simulatorPackageName: string): IFuture<string[]> {
		return this.frameworkProjectSimulatorService.getSimulatorParams(simulatorPackageName);
	}
}
$injector.register("projectSimulatorService", ProjectSimulatorService);

export class CordovaSimulatorService implements IProjectSimulatorService {
	private static PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";
	private static PLUGINS_API_CONTRACT: string = "/appbuilder/api/cordova/plugins/package";

	constructor(private $config: IConfiguration,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $server: Server.IServer,
		private $serverExtensionsService: IServerExtensionsService) { }

	public getSimulatorParams(simulatorPackageName: string): IFuture<string[]> {
		return (() => {
			var pluginsPath = this.prepareCordovaPlugins(simulatorPackageName).wait();
			var projectData = this.$project.projectData;
			var corePlugins = this.$project.getProperty("CorePlugins", "debug");

			return [
				"--statusbarstyle", projectData.iOSStatusBarStyle,
				"--frameworkversion", projectData.FrameworkVersion,
				"--orientations", projectData.DeviceOrientations.join(";"),
				"--corepluginspath", pluginsPath,
				"--supportedplatforms", this.$project.getProjectTargets().wait().join(";"),
				"--plugins", (corePlugins || []).join(";")
			];
		}).future<string[]>()();
	}

	private prepareCordovaPlugins(simulatorPackageName: string): IFuture<string> {
		return (() => {
			var packageVersion = this.$serverExtensionsService.getExtensionVersion(simulatorPackageName);
			var pluginsPath = path.join(this.$serverExtensionsService.cacheDir, this.getPluginsDirName(packageVersion));

			var pluginsApiEndpoint = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + CordovaSimulatorService.PLUGINS_API_CONTRACT;

			if (!this.$fs.exists(pluginsPath).wait()) {
				try {
					this.$logger.info("Downloading core Cordova plugins...");

					this.$fs.createDirectory(pluginsPath).wait();
					var zipPath = path.join(pluginsPath, "plugins.zip");

					this.$logger.debug("Downloading Cordova plugins package into '%s'", zipPath);
					var zipFile = this.$fs.createWriteStream(zipPath);
					this.$server.cordova.getPluginsPackage(zipFile).wait();

					this.$logger.debug("Unpacking Cordova plugins from %s", zipPath);
					this.$fs.unzip(zipPath, pluginsPath).wait();

					this.$logger.info("Finished downloading plugins.");
				} catch(err) {
					this.$fs.closeStream(zipFile).wait();
					this.$fs.deleteDirectory(pluginsPath).wait();
					throw err;
				}
			}

			return pluginsPath;
		}).future<string>()();
	}

	private getPluginsDirName(serverVersion: string) {
		var result: string;
		if (this.$config.DEBUG) {
			result = CordovaSimulatorService.PLUGINS_PACKAGE_IDENTIFIER;
		} else {
			result = CordovaSimulatorService.PLUGINS_PACKAGE_IDENTIFIER + "-" + serverVersion;
		}
		this.$logger.debug("PLUGINS dir is: " + result);
		return result;
	}
}
$injector.register("cordovaSimulatorService", CordovaSimulatorService);

export class NativeScriptSimulatorService implements IProjectSimulatorService {
	public getSimulatorParams(simulatorPackageName: string): IFuture<string[]> {
		return (() => <string[]>[]).future<string[]>()();
	}
}
$injector.register("nativeScriptSimulatorService", NativeScriptSimulatorService);

export class MobileWebSiteSimulatorService implements IProjectSimulatorService {
	public getSimulatorParams(simulatorPackageName: string): IFuture<string[]> {
		return (() => <string[]>[]).future<string[]>()();
	}
}
$injector.register("mobileWebsiteSimulatorService", MobileWebSiteSimulatorService);
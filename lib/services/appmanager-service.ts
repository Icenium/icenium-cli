///<reference path="../.d.ts"/>
"use strict";

import constants = require("../common/mobile/constants");
import util = require("util");
import options = require("../options");
import os = require("os");
import commonOptions = require("../common/options");

class AppManagerService implements IAppManagerService {
	private static LIVEPATCH_PLUGIN_ID = "com.telerik.LivePatch";

	constructor(
		private $config: IConfiguration,
		private $server: Server.IServer,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $loginManager: ILoginManager,
		private $opener: IOpener,
		private $buildService: Project.IBuildService,
		private $pluginsService: IPluginsService,
		private $progressIndicator: IProgressIndicator,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	upload(platform: string): IFuture<void> {
		return (() => {
			var mobilePlatform = this.$mobileHelper.validatePlatformName(platform);
			this.$project.ensureProject();
			this.$loginManager.ensureLoggedIn().wait();

			this.$logger.info("Accessing Telerik AppManager store.");
			this.$server.tam.verifyStoreCreated().wait();

			this.$logger.info("Building release package.");
			var buildResult = this.$buildService.build({
				platform: mobilePlatform,
				configuration: "Release",
				provisionTypes: [constants.ProvisionType.Development, constants.ProvisionType.Enterprise, constants.ProvisionType.AdHoc],
				showWp8SigningMessage: false,
				buildForTAM: true,
				downloadFiles: options.download
			}).wait();

			if(!buildResult[0] || !buildResult[0].solutionPath) {
				this.$errors.fail({ formatStr: "Build failed.", suppressCommandHelp: true });
			}

			this.$logger.info("Uploading package to Telerik AppManager.");
			var projectName = this.$project.projectData.ProjectName;
			var solutionPath = buildResult[0].solutionPath;
			var projectPath = solutionPath.substr(solutionPath.indexOf("/") + 1);
			this.$server.tam.uploadApplication(projectName, projectName, projectPath).wait();

			this.$logger.info("Successfully uploaded package.");

			this.openAppManagerStore();
		}).future<void>()();
	}

	public openAppManagerStore(): void {
		var tamUrl = util.format("%s://%s/appbuilder/Services/tam", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
		this.$logger.info("Go to %s to manage your apps.", tamUrl);
		this.$opener.open(tamUrl);
	}

	public publishLivePatch(platforms: string[]): IFuture<void> {
		return (() => {
			platforms = _.map(platforms, platform => this.$mobileHelper.normalizePlatformName(platform));
			var cachedOptionsRelease = commonOptions.release;
			commonOptions.release = true;
			this.configureLivePatchPlugin().wait();

			this.$logger.warn("If you have not published an AppManager LiveSync-enabled major version of this app before, you will not be able to distribute an AppManager LiveSync update for it.");
			this.$logger.info("To create a new major version enabled for AppManager LiveSync, run `$ appbuilder appmanager upload <Platform>`");

			this.$project.importProject().wait();
			this.$logger.printInfoMessageOnSameLine("Publishing patch for " + platforms.join(", ") + "...");
			this.$progressIndicator.showProgressIndicator(this.$server.tam.uploadPatch(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName, <any>{ Platforms: platforms }), 2000).wait();
			this.$logger.printInfoMessageOnSameLine(os.EOL);
			commonOptions.release = cachedOptionsRelease;

			this.openAppManagerStore();
		}).future<void>()();
	}

	private configureLivePatchPlugin(): IFuture<void> {
		return (() => {
			var plugins = this.$pluginsService.getInstalledPlugins();
			if(!_.any(plugins, plugin => plugin.data.Identifier === AppManagerService.LIVEPATCH_PLUGIN_ID)) {
				this.$logger.warn("The AppManager LiveSync plugin is not enabled for your project. Enabling it now for the release build configuration...");
				this.$pluginsService.addPlugin(AppManagerService.LIVEPATCH_PLUGIN_ID).wait();
				this.$logger.info("AppManager LiveSync is now enabled for the release build configuration.");
			}
		}).future<void>()();
	}
}
$injector.register("appManagerService", AppManagerService);

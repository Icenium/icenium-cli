///<reference path="../.d.ts"/>
"use strict";

import constants = require("../common/mobile/constants");
import util = require("util");
import os = require("os");
import options = require("../common/options");

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
		private $progressIndicator: IProgressIndicator,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $injector: IInjector) { }

	upload(platform: string): IFuture<void> {
		return (() => {
			let mobilePlatform = this.$mobileHelper.validatePlatformName(platform);
			this.$project.ensureProject();
			this.$loginManager.ensureLoggedIn().wait();

			this.$logger.info("Accessing Telerik AppManager store.");
			this.$server.tam.verifyStoreCreated().wait();

			this.$logger.info("Building release package.");
			let buildResult = this.$buildService.build({
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
			let projectName = this.$project.projectData.ProjectName;
			let solutionPath = buildResult[0].solutionPath;
			let projectPath = solutionPath.substr(solutionPath.indexOf("/") + 1);
			this.$server.tam.uploadApplication(projectName, projectName, projectPath).wait();

			this.$logger.info("Successfully uploaded package.");

			this.openAppManagerStore();
		}).future<void>()();
	}

	public openAppManagerStore(): void {
		let tamUrl = `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/Services/tam`;
		this.$logger.info("Go to %s to manage your apps.", tamUrl);
		this.$opener.open(tamUrl);
	}

	public publishLivePatch(platforms: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureCordovaProject();
			this.$loginManager.ensureLoggedIn().wait();

			platforms = _.map(platforms, platform => this.$mobileHelper.normalizePlatformName(platform));
			let cachedOptionsRelease = options.release;
			options.release = true;
			this.configureLivePatchPlugin().wait();

			this.$logger.warn("If you have not published an AppManager LiveSync-enabled version of this app before, you will not be able to distribute an AppManager LiveSync update for it.");
			this.$logger.info("To learn how to create a new version enabled for AppManager LiveSync, run `$ appbuilder help appmanager livesync`");

			this.$project.importProject().wait();
			this.$logger.printInfoMessageOnSameLine("Publishing patch for " + platforms.join(", ") + "...");
			this.$progressIndicator.showProgressIndicator(this.$server.tam.uploadPatch(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName, <any>{ Platforms: platforms }), 2000).wait();
			this.$logger.printInfoMessageOnSameLine(os.EOL);
			options.release = cachedOptionsRelease;

			this.openAppManagerStore();
		}).future<void>()();
	}

	private configureLivePatchPlugin(): IFuture<void> {
		return (() => {
			// Resolve pluginsService here as in its constructor it fails when project is not Cordova.
			let $pluginsService: IPluginsService = this.$injector.resolve("pluginsService");
			let plugins = $pluginsService.getInstalledPlugins();
			if(!_.any(plugins, plugin => plugin && plugin.data && plugin.data.Identifier === AppManagerService.LIVEPATCH_PLUGIN_ID)) {
				this.$logger.warn("The AppManager LiveSync plugin is not enabled for your project. Enabling it now for the release build configuration...");
				$pluginsService.addPlugin(AppManagerService.LIVEPATCH_PLUGIN_ID).wait();
				this.$logger.info("AppManager LiveSync is now enabled for the release build configuration.");
			}
		}).future<void>()();
	}
}
$injector.register("appManagerService", AppManagerService);

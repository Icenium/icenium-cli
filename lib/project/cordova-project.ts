///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");

import frameworkProjectBaseLib = require("./framework-project-base");
import helpers = require("./../common/helpers");
import MobileHelper = require("../common/mobile/mobile-helper");

export class CordovaProject extends frameworkProjectBaseLib.FrameworkProjectBase implements Project.IFrameworkProject {
	private static PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";
	private static PLUGINS_API_CONTRACT: string = "/appbuilder/api/cordova/plugins/package";

	constructor(private $config: IConfiguration,
		$fs: IFileSystem,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants,
		private $projectFilesManager: Project.IProjectFilesManager,
		private $templatesService: ITemplatesService,
		$resources: IResourceLoader,
		private $serverExtensionsService: IServerExtensionsService,
		private $server: Server.IServer) {
		super($logger, $fs, $resources);
	}

	public get name(): string {
		return this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova;
	}

	public get capabilities(): IProjectCapabilities {
		return {
			build: true,
			buildCompanion: true,
			deploy: true,
			simulate: true,
			livesync: true,
			livesyncCompanion: true,
			updateKendo: true
		};
	}

	public get defaultProjectTemplate(): string {
		return this.$config.DEFAULT_CORDOVA_PROJECT_TEMPLATE;
	}

	public get liveSyncUrl(): string {
		return "icenium://";
	}

	public get requiredAndroidApiLevel(): number {
		return 10;  // 2.3 Gingerbread
	}

	public get configFiles(): Project.IConfigurationFile[] {
		var allConfigFiles = this.$projectFilesManager.availableConfigFiles;
		return _.values(allConfigFiles);
	}

	public getProjectTargets(projectDir: string): IFuture<string[]> {
		var fileMask = /^cordova\.(\w*)\.js$/i;
		return this.getProjectTargetsBase(projectDir, fileMask);
	}

	public getTemplateFilename(name: string): string {
		return util.format("Telerik.Mobile.Cordova.%s.zip", name);
	}

	public alterPropertiesForNewProject(properties: any, projectName: string): void {
		this.alterPropertiesForNewProjectBase(properties, projectName);
	}

	public projectTemplatesString(): IFuture<string> {
		return this.$templatesService.getTemplatesString(/.*Telerik\.Mobile\.Cordova\.(.+)\.zip/);
	}

	public getProjectFileSchema(): IFuture<any> {
		return this.getProjectFileSchemaByName(this.name);
	}

	public getFullProjectFileSchema(): IFuture<any> {
		return this.getFullProjectFileSchemaByName(this.name);
	}

	public adjustBuildProperties(buildProperties: any, projectData?: IProjectData): any {
		buildProperties.CorePlugins = projectData.CorePlugins;
		return buildProperties;
	}

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void> {
		return (() => {
			var platforms = _.keys(MobileHelper.platformCapabilities);
			_.each(platforms, (platform: string) => this.ensureCordovaJs(platform, projectDir, frameworkVersion).wait());

			var appResourcesDir = this.$resources.appResourcesDir;
			var appResourceFiles = helpers.enumerateFilesInDirectorySync(appResourcesDir);
			appResourceFiles.forEach((appResourceFile) => {
				var relativePath = path.relative(appResourcesDir, appResourceFile);
				var targetFilePath = path.join(projectDir, relativePath);
				this.$logger.trace("Checking app resources: %s must match %s", appResourceFile, targetFilePath);
				if (!this.$fs.exists(targetFilePath).wait()) {
					this.printAssetUpdateMessage();
					this.$logger.trace("File not found, copying %s", appResourceFile);
					this.$fs.copyFile(appResourceFile, targetFilePath).wait();
				}
			});

		}).future<void>()();
	}

	private ensureCordovaJs(platform: string, projectDir: string, frameworkVersion: string): IFuture<void> {
		return (() => {
			var cordovaJsFileName = path.join(projectDir, util.format("cordova.%s.js", platform).toLowerCase());
			if (!this.$fs.exists(cordovaJsFileName).wait()) {
				this.printAssetUpdateMessage();
				var cordovaJsSourceFilePath = this.$resources.buildCordovaJsFilePath(frameworkVersion, platform);
				this.$fs.copyFile(cordovaJsSourceFilePath, cordovaJsFileName).wait();
			}
		}).future<void>()();
	}

	public getSimulatorParams(projectDir: string, projectData: IProjectData, simulatorPackageName: string): IFuture<string[]> {
		return (() => {
			var pluginsPath = this.prepareCordovaPlugins(simulatorPackageName).wait();

			return [
				"--statusbarstyle", projectData.iOSStatusBarStyle,
				"--frameworkversion", projectData.FrameworkVersion,
				"--orientations", projectData.DeviceOrientations.join(";"),
				"--corepluginspath", pluginsPath,
				"--supportedplatforms", this.getProjectTargets(projectDir).wait().join(";"),
				"--plugins", projectData.CorePlugins.join(";")
			];
		}).future<string[]>()();
	}

	public completeProjectProperties(properties: any): boolean {
		var updated = false;

		if (_.has(properties, "name")) {
			properties.ProjectName = properties.name;
			delete properties.name;
			updated = true;
		}

		if (_.has(properties, "iOSDisplayName")) {
			properties.DisplayName = properties.iOSDisplayName;
			delete properties.iOSDisplayName;
			updated = true;
		}
		if (!properties.DisplayName) {
			properties.DisplayName = properties.ProjectName;
			updated = true;
		}

		["WP8PublisherID", "WP8ProductID"].forEach((wp8guid) => {
			if (!_.has(properties, wp8guid) || properties[wp8guid] === "") {
				properties[wp8guid] = MobileHelper.generateWP8GUID();
				updated = true;
			}
		});

		return updated;
	}

	private prepareCordovaPlugins(simulatorPackageName: string): IFuture<string> {
		return (() => {
			var packageVersion = this.$serverExtensionsService.getExtensionVersion(simulatorPackageName);
			var pluginsPath = path.join(this.$serverExtensionsService.cacheDir, this.getPluginsDirName(packageVersion));

			var pluginsApiEndpoint = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + CordovaProject.PLUGINS_API_CONTRACT;

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
			result = CordovaProject.PLUGINS_PACKAGE_IDENTIFIER;
		} else {
			result = CordovaProject.PLUGINS_PACKAGE_IDENTIFIER + "-" + serverVersion;
		}
		this.$logger.debug("PLUGINS dir is: " + result);
		return result;
	}
}
$injector.register("cordovaProject", CordovaProject);

///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");

import frameworkProjectBaseLib = require("./framework-project-base");
import helpers = require("./../common/helpers");
import MobileHelper = require("../common/mobile/mobile-helper");

export class NativeScriptProject extends frameworkProjectBaseLib.FrameworkProjectBase implements Project.IFrameworkProject {
	constructor(projectInformation: Project.IProjectInformation,
		private $config: IConfiguration,
		$errors: IErrors,
		$fs: IFileSystem,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants,
		private $projectFilesManager: Project.IProjectFilesManager,
		$resources: IResourceLoader,
		private $templatesService: ITemplatesService) {
		super(projectInformation, $logger, $fs, $resources, $errors);
	}

	public get name(): string {
		return this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript;
	}

	public get capabilities(): IProjectCapabilities {
		return {
			build: true,
			buildCompanion: true,
			deploy: true,
			simulate: false,
			livesync: false,
			livesyncCompanion: true,
			updateKendo: false
		};
	}

	public get defaultProjectTemplate(): string {
		return this.$config.DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE;
	}

	public get liveSyncUrl(): string {
		return "nativescript://";
	}

	public get requiredAndroidApiLevel(): number {
		return 17; // 4.2 JellyBean
	}

	public get configFiles():  Project.IConfigurationFile[] {
		var allConfigFiles = this.$projectFilesManager.availableConfigFiles;
		return [
			allConfigFiles["ios-info"],
			allConfigFiles["android-manifest"]
		]
	}

	public getTemplateFilename(name: string): string {
		return util.format("Telerik.Mobile.NativeScript.%s.zip", name);
	}

	public alterPropertiesForNewProject(properties: any, projectName: string): void {
		this.alterPropertiesForNewProjectBase(properties, projectName);
	}

	public projectTemplatesString(): IFuture<string> {
		return this.$templatesService.getTemplatesString(/.*Telerik\.Mobile\.NativeScript\.(.+)\.zip/);
	}

	public getProjectFileSchema(): IFuture<any> {
		return this.getProjectFileSchemaByName(this.name);
	}

	public getFullProjectFileSchema(): IFuture<any> {
		return this.getFullProjectFileSchemaByName(this.name);
	}

	public getProjectTargets(projectDir: string): IFuture<string[]> {
		var dir = path.join(projectDir, "app");
		var fileMask = /^bootstrap\.(\w*)\.js$/i;

		return this.getProjectTargetsBase(dir, fileMask);
	}

	public adjustBuildProperties(buildProperties: any, projectData?: IProjectData): any {
		return buildProperties;
	}

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void> {
		return (() => {
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
}
$injector.register("nativeScriptProject", NativeScriptProject);
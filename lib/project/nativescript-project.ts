///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");
import Future = require("fibers/future");

import frameworkProjectBaseLib = require("./framework-project-base");
import helpers = require("./../common/helpers");
import MobileHelper = require("../common/mobile/mobile-helper");

export class NativeScriptProject extends frameworkProjectBaseLib.FrameworkProjectBase implements Project.IFrameworkProject {
	constructor(private $config: IConfiguration,
		$errors: IErrors,
		$fs: IFileSystem,
		private $jsonSchemaConstants: IJsonSchemaConstants,
		$jsonSchemaValidator: IJsonSchemaValidator,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants,
		private $projectFilesManager: Project.IProjectFilesManager,
		$resources: IResourceLoader,
		private $templatesService: ITemplatesService) {
		super($logger, $fs, $resources, $errors, $jsonSchemaValidator);
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
			updateKendo: false,
			emulate: true
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

	public get startPackageActivity(): string {
		return "com.tns.NativeScriptActivity";
	}

	public getValidationSchemaId(): string {
		return this.$jsonSchemaConstants.NATIVESCRIPT_SCHEMA_ID;
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

	public getProjectFileSchema(): IDictionary<any> {
		return this.getProjectFileSchemaByName(this.name);
	}

	public getProjectTargets(projectDir: string): IFuture<string[]> {
		return Future.fromResult(["android", "ios"]);
	}

	public adjustBuildProperties(buildProperties: any, projectInformation?: Project.IProjectInformation): any {
		if(buildProperties.Platform === "WP8") {
			this.$errors.fail("You will be able to build NativeScript based applications for WP8 platform in a future release of the Telerik AppBuilder CLI.");
		}

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

		return updated;
	}
}
$injector.register("nativeScriptProject", NativeScriptProject);
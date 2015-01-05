///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");

import frameworkProjectBaseLib = require("./framework-project-base");
import helpers = require("../common/helpers");

export class MobileWebSiteProject extends frameworkProjectBaseLib.FrameworkProjectBase implements Project.IFrameworkProject {
	constructor(private $config: IConfiguration,
		$fs: IFileSystem,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants,
		private $templatesService: ITemplatesService,
		$resources: IResourceLoader) {
		super($logger, $fs, $resources);
	}

	public get name(): string {
		return this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebSite;
	}

	public get capabilities(): IProjectCapabilities {
		return {
			build: false,
			buildCompanion: false,
			deploy: false,
			simulate: true,
			livesync: false,
			livesyncCompanion: false,
			updateKendo: false
		};
	}

	public get defaultProjectTemplate(): string {
		return this.$config.DEFAULT_WEBSITE_PROJECT_TEMPLATE;
	}

	public get liveSyncUrl(): string {
		throw new Error ("Not applicable.");
	}

	public get requiredAndroidApiLevel(): number {
		throw new Error ("Not applicable.");
	}

	public get configFiles():  Project.IConfigurationFile[] {
		return [];
	}

	public getProjectTargets(projectDir: string): IFuture<string[]> {
		var result: string[] = [];
		return (() => { return result; }).future<string[]>()();
	}

	public getTemplateFilename(name: string): string {
		return util.format("Telerik.Mobile.MobileWebSite.%s.zip", name);
	}

	public alterPropertiesForNewProject(properties: any, projectName: string): void { }

	public projectTemplatesString(): IFuture<string> {
		return this.$templatesService.getTemplatesString(/.*Telerik\.Mobile\.MobileWebsite\.(.+)\.zip/);
	}

	public getProjectFileSchema(): IFuture<any> {
		return this.getProjectFileSchemaByName(this.name);
	}

	public getFullProjectFileSchema(): IFuture<any> {
		return this.getFullProjectFileSchemaByName(this.name);
	}

	public adjustBuildProperties(buildProperties: any, projectData?: IProjectData): any {
		return buildProperties;
	}

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void> {
		return (() => { }).future<void>()();
	}

	public getSimulatorParams(projectDir: string, projectData: IProjectData, simulatorPackageName: string): IFuture<string[]> {
		return (() => {
			var result: string[] = [];
			return result;
		}).future<string[]>()();
	}

	public completeProjectProperties(properties: IProjectData): boolean {
		return false;
	}
}
$injector.register("webSiteProject", MobileWebSiteProject);
$injector.register("mobileWebsiteProject", MobileWebSiteProject);

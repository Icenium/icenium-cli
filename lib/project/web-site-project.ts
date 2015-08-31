///<reference path="../.d.ts"/>
"use strict";
import future = require("fibers/future");
import * as frameworkProjectBaseLib from "./framework-project-base";

export class MobileWebSiteProject extends frameworkProjectBaseLib.FrameworkProjectBase implements Project.IFrameworkProject {
	constructor(private $config: IConfiguration,
		$errors: IErrors,
		$fs: IFileSystem,
		$jsonSchemaValidator: IJsonSchemaValidator,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants,
		private $templatesService: ITemplatesService,
		$resources: IResourceLoader,
		$options: IOptions) {
		super($logger, $fs, $resources, $errors, $jsonSchemaValidator, $options);
	}

	public get name(): string {
		return this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite;
	}

	public get capabilities(): IProjectCapabilities {
		return {
			build: false,
			buildCompanion: false,
			deploy: false,
			simulate: true,
			livesync: false,
			livesyncCompanion: false,
			updateKendo: false,
			emulate: false,
			publish: true,
			uploadToAppstore: false,
			canChangeFrameworkVersion: false,
			imageGeneration: false,
			wp8Supported: false
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

	public get startPackageActivity(): string {
		throw new Error("Not applicable.");
	}

	public get relativeAppResourcesPath(): string {
		throw new Error("Not applicable.");
	}

	public getValidationSchemaId(): string {
		return null;
	}

	public getProjectTargets(projectDir: string): IFuture<string[]> {
		let result: string[] = [];
		return (() => { return result; }).future<string[]>()();
	}

	public getTemplateFilename(name: string): string {
		return `Telerik.Mobile.MobileWebsite.${name}.zip`;
	}

	public alterPropertiesForNewProject(properties: any, projectName: string): void { /* method is not used for web site projects */ }

	public checkSdkVersions(platform: string, projectData: IProjectData): void { /* method is not used for web site projects */ }

	public projectTemplatesString(): IFuture<string> {
		return this.$templatesService.getTemplatesString(/.*Telerik\.Mobile\.MobileWebsite\.(.+)\.zip/);
	}

	public getProjectFileSchema(): IDictionary<any> {
		return this.getProjectFileSchemaByName(this.name);
	}

	public adjustBuildProperties(buildProperties: any, projectInformation?: Project.IProjectInformation): any {
		return future.fromResult();
	}

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void> {
		return future.fromResult();
	}

	public completeProjectProperties(properties: IProjectData): boolean {
		return false;
	}
}
$injector.register("mobileWebsiteProject", MobileWebSiteProject);

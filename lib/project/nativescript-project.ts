import * as path from "path";
import * as util from "util";
import Future = require("fibers/future");
import {FrameworkProjectBase} from "./framework-project-base";
import semver = require("semver");
import  { startPackageActivityNames } from "../common/mobile/constants";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/mobile/constants";

export class NativeScriptProject extends FrameworkProjectBase implements Project.IFrameworkProject {
	constructor(private $config: IConfiguration,
		private $jsonSchemaConstants: IJsonSchemaConstants,
		private $projectConstants: Project.IConstants,
		private $configFilesManager: Project.IConfigFilesManager,
		private $staticConfig: Config.IStaticConfig,
		private $templatesService: ITemplatesService,
		private $injector: IInjector,
		private $nativeScriptProjectCapabilities: Project.ICapabilities,
		$errors: IErrors,
		$fs: IFileSystem,
		$jsonSchemaValidator: IJsonSchemaValidator,
		$logger: ILogger,
		$resources: IResourceLoader,
		$options: IOptions) {
		super($logger, $fs, $resources, $errors, $jsonSchemaValidator, $options);
	}

	public get pluginsService(): IPluginsService {
		return this.$injector.resolve("nativeScriptProjectPluginsService");
	}
	public get name(): string {
		return TARGET_FRAMEWORK_IDENTIFIERS.NativeScript;
	}

	public get capabilities(): Project.ICapabilities {
		return this.$nativeScriptProjectCapabilities;
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

	public get configFiles(): Project.IConfigurationFile[] {
		let allConfigFiles = this.$configFilesManager.availableConfigFiles;
		return [
			allConfigFiles["nativescript-ios-info"],
			allConfigFiles["nativescript-android-manifest"]
		];
	}

	public get startPackageActivity(): string {
		return startPackageActivityNames[TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()];
	}

	public get relativeAppResourcesPath(): string {
		return path.join('app', 'App_Resources');
	}

	public get projectSpecificFiles(): string[] {
		return [this.$projectConstants.PACKAGE_JSON_NAME];
	}

	public getValidationSchemaId(): string {
		return this.$jsonSchemaConstants.NATIVESCRIPT_SCHEMA_ID;
	}

	public getTemplateFilename(name: string): string {
		return util.format("Telerik.Mobile.NS.%s.zip", name.replace(/TypeScript/, "TS"));
	}

	public alterPropertiesForNewProject(properties: any, projectName: string): void {
		this.alterPropertiesForNewProjectBase(properties, projectName);
	}

	public checkSdkVersions(platform: string, projectData: Project.IData): void { /* this method is not applicable to {N} projects */ }

	public projectTemplatesString(): IFuture<string> {
		return ((): string => {
			let templateStrings = this.$templatesService.getTemplatesString(/.*Telerik\.Mobile\.NS\.(.+)\.zip/, { "blank": "JavaScript.Blank" }).wait();
			return templateStrings.replace(/TS[.]/g, "TypeScript.");
		}).future<string>()();
	}

	public getProjectFileSchema(): IDictionary<any> {
		return this.getProjectFileSchemaByName(this.name);
	}

	public getProjectTargets(projectDir: string): IFuture<string[]> {
		return Future.fromResult(["android", "ios"]);
	}

	public adjustBuildProperties(buildProperties: any, projectInformation?: Project.IProjectInformation): any {
		if (buildProperties.Platform === "WP8") {
			this.$errors.fail("You will be able to build NativeScript based applications for WP8 platform in a future release of the Telerik AppBuilder CLI.");
		}

		return buildProperties;
	}

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void> {
		return (() => {
			let appResourcesDir = this.$resources.getPathToAppResources(TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
			let appResourceFiles = this.$fs.enumerateFilesInDirectorySync(appResourcesDir);
			// In 0.10.0 original template, App_Resources directory is not included in app directory.
			let appResourcesHolderDirectory = path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME);
			if (semver.eq(frameworkVersion, "0.9.0")
				|| (!this.$fs.exists(path.join(appResourcesHolderDirectory, this.$staticConfig.APP_RESOURCES_DIR_NAME)).wait()
					&& this.$fs.exists(path.join(projectDir, this.$staticConfig.APP_RESOURCES_DIR_NAME)).wait())) {
				appResourcesHolderDirectory = projectDir;
			}
			appResourceFiles.forEach((appResourceFile) => {
				let relativePath = path.relative(appResourcesDir, appResourceFile);
				let targetFilePath = path.join(appResourcesHolderDirectory, this.$staticConfig.APP_RESOURCES_DIR_NAME, relativePath);
				this.$logger.trace("Checking app resources: %s must match %s", appResourceFile, targetFilePath);
				if (!this.$fs.exists(targetFilePath).wait()) {
					this.printAssetUpdateMessage();
					this.$logger.trace("File not found, copying %s", appResourceFile);
					this.$fs.copyFile(appResourceFile, targetFilePath).wait();
				}
			});
		}).future<void>()();
	}

	public getPluginVariablesInfo(projectInformation: Project.IProjectInformation, projectDir?: string, configuration?: string): IFuture<IDictionary<IStringDictionary>> {
		return (() => {
			let packageJsonContent = this.$fs.readJson(path.join(projectDir, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
			let nativescript = packageJsonContent && packageJsonContent.nativescript;
			let dependencies = packageJsonContent && packageJsonContent.dependencies;
			if (nativescript && dependencies) {
				let pluginsVariables: IStringDictionary = {};
				_.keys(dependencies).forEach(dependency => {
					let variablesKey = `${dependency}-variables`;
					let variables = nativescript[variablesKey];
					if (variables) {
						pluginsVariables[dependency] = variables;
					}
				});

				return pluginsVariables;
			}

			return null;
		}).future<IDictionary<IStringDictionary>>()();
	}
}
$injector.register("nativeScriptProject", NativeScriptProject);

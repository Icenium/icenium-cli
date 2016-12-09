import * as path from "path";
import * as util from "util";
import * as temp from "temp";
import {TARGET_FRAMEWORK_IDENTIFIERS} from "../common/constants";
import {FrameworkProjectBase} from "./framework-project-base";
import Future = require("fibers/future");
temp.track();

export class NativeScriptProject extends FrameworkProjectBase implements Project.IFrameworkProject {
	constructor(private $config: IConfiguration,
		private $jsonSchemaConstants: IJsonSchemaConstants,
		private $projectConstants: Project.IConstants,
		private $configFilesManager: Project.IConfigFilesManager,
		private $staticConfig: Config.IStaticConfig,
		private $templatesService: ITemplatesService,
		private $injector: IInjector,
		private $nativeScriptProjectCapabilities: Project.ICapabilities,
		private $dateProvider: IDateProvider,
		private $typeScriptService: ITypeScriptService,
		private $npmService: INpmService,
		$errors: IErrors,
		$fs: IFileSystem,
		$jsonSchemaValidator: IJsonSchemaValidator,
		$logger: ILogger,
		$options: IOptions,
		$resources: IResourceLoader) {
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

	public get relativeAppResourcesPath(): string {
		return path.join('app', 'App_Resources');
	}

	public get projectSpecificFiles(): string[] {
		return [this.$projectConstants.PACKAGE_JSON_NAME];
	}

	private get $nativeScriptMigrationService(): IFrameworkMigrationService {
		return this.$injector.resolve("nativeScriptMigrationService");
	}

	private get $nativeScriptResources(): INativeScriptResources {
		return this.$injector.resolve("nativeScriptResources");
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
			let appResourcesHolderDirectory = path.join(projectDir, this.$projectConstants.NATIVESCRIPT_APP_DIR_NAME);

			appResourceFiles.forEach((appResourceFile) => {
				let relativePath = path.relative(appResourcesDir, appResourceFile);
				let targetFilePath = path.join(appResourcesHolderDirectory, this.$staticConfig.APP_RESOURCES_DIR_NAME, relativePath);
				this.$logger.trace("Checking app resources: %s must match %s", appResourceFile, targetFilePath);
				if (!this.$fs.exists(targetFilePath)) {
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

	public updateMigrationConfigFile(): IFuture<void> {
		return (() => {
			let nativeScriptMigrationFileName = this.$nativeScriptResources.nativeScriptMigrationFile;
			let currentMigrationConfigStatus = this.$fs.getFsStats(nativeScriptMigrationFileName);
			let currentTime = this.$dateProvider.getCurrentDate();

			if (currentTime.getTime() - currentMigrationConfigStatus.mtime.getTime() < FrameworkProjectBase.MAX_MIGRATION_FILE_EDIT_TIME_DIFFERENCE) {
				// We do not need to update the migration file if it has been modified in the past 2 hours.
				this.$logger.trace(`The current NativeScript migration file was updated on ${currentMigrationConfigStatus.mtime}.`);
				return;
			}

			let downloadDestinationDirectory = temp.mkdirSync("nativescript-migration");
			let downloadedFilePath = path.join(downloadDestinationDirectory, "nativeScript-migration-data.json");

			try {
				this.$nativeScriptMigrationService.downloadMigrationConfigFile(downloadedFilePath).wait();
			} catch (err) {
				// This exception is caused probably by issue with the internet connection of the user.
				this.$logger.trace("Failed to download the NativeScript migration file.");
				return;
			}

			let newMigrationFileContent = this.$fs.readText(downloadedFilePath).wait();
			let currentMigrationFileContent = this.$fs.readText(nativeScriptMigrationFileName).wait();

			if (currentMigrationFileContent !== newMigrationFileContent) {
				this.$fs.writeFile(nativeScriptMigrationFileName, newMigrationFileContent).wait();
				this.$logger.trace(`NativeScript migration file updated on ${currentTime}.`);
			}
		}).future<void>()();
	}

	public ensureProject(projectDir: string): IFuture<void> {
		return (() => {
			if (this.$typeScriptService.isTypeScriptProject(projectDir).wait()) {
				try {
					this.$npmService.install(projectDir).wait();
				} catch (err) {
					this.$logger.trace(`Failed to install all npm dependencies in the project. Error: ${err}.`);
					this.$logger.warn("The installation of the project dependencies from npm failed. The TypeScript transpilation may fail due to missing .d.ts files.");
				}
			}
		}).future<void>()();
	}
}

$injector.register("nativeScriptProject", NativeScriptProject);

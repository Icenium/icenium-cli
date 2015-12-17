declare module Project {
	interface IProject {
		projectData: IProjectData;
		capabilities: IProjectCapabilities;
		configurationSpecificData: IDictionary<IDictionary<any>>;
		configurations: string[];
		requiredAndroidApiLevel: number;
		projectConfigFiles: Project.IConfigurationFile[];
		startPackageActivity: string;

		createNewProject(projectName: string, framework: string, template?: string): IFuture<void>;
		initializeProjectFromExistingFiles(framework: string, projectDir?: string, appName?: string): IFuture<void>;
		createProjectFile(projectDir: string, properties: any): IFuture<void>;
		createTemplateFolder(projectDir: string): IFuture<void>;
		hasBuildConfigurations(): boolean;

		getNewProjectDir(): string;
		getProjectSchema(): IFuture<any>;
		getLiveSyncUrl(): string;
		getProjectDir(): IFuture<string>;
		getBuildConfiguration(): string;
		getTempDir(extraSubdir?: string): IFuture<string>;
		getProperty(propertyName: string, configuration: string): any;
		getProjectTargets(): IFuture<string[]>;
		getConfigFileContent(template: string): IFuture<any>;
		updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void>;
		printProjectProperty(property: string, configuration?: string): IFuture<void>;
		setProperty(propertyName: string, value: any, configuration: string): void;
		validateProjectProperty(property: string, args: string[], mode: string): IFuture<boolean>;
		adjustBuildProperties(buildProperties: any): any;
		saveProject(projectDir?: string, configurations?: string[]): IFuture<void>;
		zipProject(): IFuture<string>;
		importProject(): IFuture<void>;

		ensureCordovaProject(): void;
		ensureProject(): void;
		ensureAllPlatformAssets(): IFuture<void>;
		enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]>;
		getConfigurationsSpecifiedByUser(): string[];
		/**
		 * Checks wether compatible sdk versions for the given platform are used.
		 * Issues a warning if there are updated versions available.
		 * @param {string} platform Android, iOS or WP8
		 */
		checkSdkVersions(platform: string): void;
		/**
		* Checks if the project language is TypeScript by enumerating all files and checking if there are at least one TypeScript file (.ts), that is not definition file(.d.ts)
		* @return {IFuture<boolean>} true when the project contains .ts files and false otherwise.
		*/
		isTypeScriptProject(): IFuture<boolean>;

		/**
		 * Returns new object, containing all typeScript and all TypeScript definition files.
		 * @return {IFuture<ITypeScriptFiles>} all typeScript and all TypeScript definition files.
		 */
		getTypeScriptFiles(): IFuture<ITypeScriptFiles>
		/**
		 * Gets the path to the project's App_Resources folder
		 * @return {IFuture<string>} The path to the App_Resources folder
		 */
		appResourcesPath(): IFuture<string>;
	}

	interface IFrameworkProject {
		name: string;
		capabilities: IProjectCapabilities;
		defaultProjectTemplate: string;
		liveSyncUrl: string;
		requiredAndroidApiLevel: number;
		configFiles: IConfigurationFile[];
		startPackageActivity: string;
		/**
		 * The path to the App_Resources folder relative to the project's root
		 * @type {string}
		 */
		relativeAppResourcesPath: string;

		/**
		 * The service that allows working with plugins for the current project type.
		 */
		pluginsService: IPluginsService;

		getTemplateFilename(name: string): string;
		getValidationSchemaId(): string;
		getProjectFileSchema(): IDictionary<any>;
		getProjectTargets(projectDir: string): IFuture<string[]>;
		projectTemplatesString(): IFuture<string>;
		alterPropertiesForNewProject(properties: any, projectName: string): void;
		completeProjectProperties(properties: any): boolean;
		adjustBuildProperties(buildProperties: any, projectInformation?: IProjectInformation): any;
		ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void>;
		/**
		 * Checks wether compatible sdk versions for the given platform are used.
		 * Issues a warning if there are updated versions available.
		 * @param {string}       platform    Android, iOS or WP8
		 * @param {IProjectData} projectData The project's data, needed to check an SDK version
		 */
		checkSdkVersions(platform: string, projectData: IProjectData): void;
	}

	interface IFrameworkProjectBase {
		alterPropertiesForNewProjectBase(properties: any, projectName: string): void;
		getProjectFileSchemaByName(name: string): IDictionary<any>;
		getProjectTargetsBase(projectDir: string, fileMask: RegExp): IFuture<string[]>;
		printAssetUpdateMessage(): void;
		getProperty(propertyName: string, configuration: string, projectInformation: Project.IProjectInformation): any;
	}

	interface IFrameworkProjectResolverBase {
		resolveByName<T>(name: string, framework: string, ctorArguments?: IDictionary<any>): T;
	}

	interface IFrameworkProjectResolver {
		resolve(framework: string): IFrameworkProject;
	}

	interface IFrameworkSimulatorServiceResolver {
		resolve(framework: string): IProjectSimulatorService;
	}

	interface IProjectInformation {
		projectData: IProjectData;
		configurationSpecificData: IDictionary<any>;
		hasBuildConfigurations: boolean;
	}

	interface IProjectFilesManager {
		availableConfigFiles: IDictionary<Project.IConfigurationFile>;
		enumerateProjectFiles(projectDir: string, additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]>;
		isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean;
		excludeFile(projectDir: string, excludeFilePath: string) : void;
	}

	interface IProjectConstants {
		PROJECT_FILE: string;
		DEBUG_CONFIGURATION_NAME: string;
		DEBUG_PROJECT_FILE_NAME: string;
		RELEASE_CONFIGURATION_NAME: string;
		RELEASE_PROJECT_FILE_NAME: string;
		CORE_PLUGINS_PROPERTY_NAME: string;
		CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME: string;
		TARGET_FRAMEWORK_IDENTIFIERS: ITargetFrameworkIdentifiers;
		APPIDENTIFIER_PROPERTY_NAME: string;
		EXPERIMENTAL_TAG: string;
		NATIVESCRIPT_APP_DIR_NAME: string;
		IMAGE_DEFINITIONS_FILE_NAME: string;
		PACKAGE_JSON_NAME: string;
	}

	interface ITargetFrameworkIdentifiers {
		Cordova: string;
		NativeScript: string;
	}

	interface IConfigurationFile {
		template: string;
		filepath: string;
		templateFilepath: string;
		helpText: string;
	}
	/**
	 * Defines an object, containing all TypeScript files (.ts) within project and all TypeScript definition files (.d.ts).
	 * TypeScript files are all files ending with .ts, so if there are any definition files, they will be placed in both
	 * typeScript files and definitionFiles collections.
	 */
	interface ITypeScriptFiles {
		definitionFiles: string[],
		typeScriptFiles: string[]
	}
}

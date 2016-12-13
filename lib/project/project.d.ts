declare module Project {
	interface IProject extends IProjectBase {
		configurationSpecificData: IDictionary<IData>;
		configurations: string[];
		requiredAndroidApiLevel: number;
		projectConfigFiles: Project.IConfigurationFile[];

		/**
		 * Checks if current project is ionic one.
		 * @param {string} projectDir Path to project directory.
		 * @return {boolean} True in case current project is Ionic, false otherwise.
		 */
		isIonicProject(projectDir: string): boolean;

		createNewProject(projectName: string, framework: string, template?: string): IFuture<void>;
		initializeProjectFromExistingFiles(framework: string, projectDir?: string, appName?: string): IFuture<void>;
		createProjectFile(projectDir: string, properties: any): IFuture<void>;

		/**
		 * Creates directory for the new project.
		 * @param {string} projectDir Directory where the project will be created.
		 * @returns {void}
		 */
		createTemplateFolder(projectDir: string): void;

		getNewProjectDir(): string;
		getProjectSchema(): IFuture<any>;
		getLiveSyncUrl(): string;
		getBuildConfiguration(): string;

		/**
		 * Creates and returns path to a temp directory in a project, where build artifacts are persisted.
		 * @param {string} @optional extraSubdir Directory that will be created inside the temp dir.
		 * @returns {string} Path to the temp dir (including the subDir in case it's passed).
		 */
		getTempDir(extraSubdir?: string): string;

		getProperty(propertyName: string, configuration: string): any;

		/**
		 * Returns list of the mobile frameworks targeted by the current project.
		 * @returns {string[]} list of all targeted mobile frameworks.
		 */
		getProjectTargets(): string[];

		/**
		 * Gets the content of a project configuration file (Info.plist, AndroidManifest.xml, etc.).
		 * @param {string} template The key of the edit file that has to be read.
		 * @returns {any} The content of the file.
		 */
		getConfigFileContent(template: string): any;

		updateProjectProperty(mode: string, propertyName: string, propertyValues: string[], configurations?: string[]): IFuture<void>;
		updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[], configurations?: string[]): IFuture<void>;
		printProjectProperty(property: string, configuration?: string): IFuture<void>;
		setProperty(propertyName: string, value: any, configuration: string): void;
		validateProjectProperty(property: string, args: string[], mode: string): IFuture<boolean>;
		adjustBuildProperties(buildProperties: any): any;

		/**
		 * Saves the project files, including configuration specific ones (.abproject, .debug.abproject, package.json, etc.)
		 * @param {string} projectDir @optional The project directory.
		 * @param {string[]} configurations Project configurations that will be persisted.
		 * @returns {void}
		 */
		saveProject(projectDir?: string, configurations?: string[]): void;
		zipProject(): IFuture<string>;
		importProject(): IFuture<void>;

		ensureCordovaProject(): void;
		ensureProject(): void;

		/**
		 * Checks all assets (App_Resources) and completes the missing one from the default template.
		 * @returns {void}
		 */
		ensureAllPlatformAssets(): void;

		getConfigurationsSpecifiedByUser(): string[];
		/**
		 * Returns a project configuration, passed by the user as a flag. Defaults to defaultConfiguration, the lexicographically first project configuration or `debug` in that order.
		 * @param {string} defaultConfiguration Configuration to which to default to if present amongs user configurations.
		 * @return {string} the project configuration.
		 */
		getProjectConfiguration(defaultConfiguration?: string): string;
		/**
		 * Returns the names of all configurations in the current project.
		 * @return {string[]} the names of all configurations in the project.
		 */
		getAllConfigurationsNames(): string[];

		/**
		 * Checks wether compatible sdk versions for the given platform are used.
		 * Issues a warning if there are updated versions available.
		 * @param {string} platform Android, iOS or WP8
		 */
		checkSdkVersions(platform: string): void;

		/**
		 * Gets the path to the project's App_Resources folder
		 * @return {string} The path to the App_Resources folder
		 */
		appResourcesPath(): string;

		/**
		 * Get information about plugin variables for current project.
		 * @param {string} configuration Optional parameter that is specified the configuration for which plugin variables info will be returned.
		 * @return {IFuture<IDictionary<IStringDictionary>>} Information about all plugins, their plugin variables and values of the variables.
		 * @example
		 * {
		 *    "plugin1": {
		 *       "variable1": "value1",
		 *       "variable2": "value2",
		 *    },
		 *    "plugin2": {
		 *       "variable3": "value3"
		 *    }
		 * }
		 */
		getPluginVariablesInfo(configuration?: string): IDictionary<IStringDictionary>;
	}

	interface IFrameworkProject extends IFrameworkProjectBase {
		name: string;
		capabilities: ICapabilities;
		defaultProjectTemplate: string;
		liveSyncUrl: string;
		requiredAndroidApiLevel: number;
		configFiles: IConfigurationFile[];
		/**
		 * The path to the App_Resources folder relative to the project's root
		 * @type {string}
		 */
		relativeAppResourcesPath: string;

		/**
		 * The service that allows working with plugins for the current project type.
		 */
		pluginsService: IPluginsService;

		/**
		 * Project specific files that should exist after init.
		 */
		projectSpecificFiles: string[]

		getTemplateFilename(name: string): string;
		getValidationSchemaId(): string;
		getProjectFileSchema(): IDictionary<any>;
		/**
		 * Returns list of the mobile frameworks targeted by the current project.
		 * @returns {string[]} list of all targeted mobile frameworks.
		 */
		getProjectTargets(projectDir: string): string[];

		/**
		 * Gets list of all available templates.
		 * @returns {string} String, containing all available templates.
		 */
		getProjectTemplatesString(): string;
		alterPropertiesForNewProject(properties: any, projectName: string): void;
		completeProjectProperties(properties: any): boolean;
		adjustBuildProperties(buildProperties: any, projectInformation?: IProjectInformation): any;

		/**
		 * Checks all assets (App_Resources) and completes the missing one from the default template.
		 * @param {string} projectDir The directory where the project is located.
		 * @param {string} frameworkVersion The version of mobile framework (Cordova's or NativeScript's version).
		 * @returns {void}
		 */
		ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): void;

		/**
		 * Checks wether compatible sdk versions for the given platform are used.
		 * Issues a warning if there are updated versions available.
		 * @param {string}       platform    Android, iOS or WP8
		 * @param {Project.IData} projectData The project's data, needed to check an SDK version
		 */
		checkSdkVersions(platform: string, projectData: Project.IData): void;

		/**
		 * Get information about plugin variables for current project.
		 * @param {Project.IProjectInformation} projectInformation Information about the project - values of properties from .abproject and configuration specific .abproject.
		 * @param {string} projectDir Optional parameter that specifies the project directory. Required for NativeScript projects.
		 * @param {string} configuration Optional parameter that is specified the configuration for which plugin variables info will be returned. Required for Cordova projects.
		 * @return {IFuture<IDictionary<IStringDictionary>>} Information about all plugins, their plugin variables and values of the variables.
		 * For NativeScript projects the values are taken from package.json. For Cordova project the information is read from .abproject (configuration specific .abproject).
		 * @example
		 * {
		 *    "plugin1": {
		 *       "variable1": "value1",
		 *       "variable2": "value2",
		 *    },
		 *    "plugin2": {
		 *       "variable3": "value3"
		 *    }
		 * }
		 */
		getPluginVariablesInfo(projectInformation: Project.IProjectInformation, projectDir?: string, configuration?: string): IDictionary<IStringDictionary>;

		/**
		 * Updates the json file which contains the migration information. If the user is not connectet to the internet the file will not be updated and the CLI will use the one which is downloaded when the CLI is installed or updated.
		 */
		updateMigrationConfigFile(): IFuture<void>;
	}

	interface IFrameworkProjectBase {
		alterPropertiesForNewProjectBase(properties: any, projectName: string): void;
		getProjectFileSchemaByName(name: string): IDictionary<any>;

		/**
		 * Returns list of the mobile frameworks targeted by the current project.
		 * @param {string} projectDir Project directory.
		 * @param {RegExp} fileMask Filtering mask used to check the project dir for platform specific files.
		 * @returns {string[]} list of all targeted mobile frameworks.
		 */
		getProjectTargetsBase(projectDir: string, fileMask: RegExp): string[];

		printAssetUpdateMessage(): void;
		getProperty(propertyName: string, configuration: string, projectInformation: Project.IProjectInformation): any;
		/**
		 * Completes any mandatory project properties which have default values.
		 * @param  {any}	properties	object containing already parsed properties
		 * @return {boolean}			whether or not the initial properties have been updated
		 */
		completeProjectProperties(properties: any): boolean;

		/**
		 * Ensures the project has all required files.
		 * @param {string} projectDir The directory of the project.
		 */
		ensureProject(projectDir: string): IFuture<void>;
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

	interface IConfigFilesManager {
		availableConfigFiles: IDictionary<Project.IConfigurationFile>;
	}

	interface IConfigurationFile {
		template: string;
		filepath: string;
		templateFilepath: string;
		helpText: string;
	}
}

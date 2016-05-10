declare module Project {
	interface IProject extends IProjectBase {
		configurationSpecificData: IDictionary<IDictionary<any>>;
		configurations: string[];
		requiredAndroidApiLevel: number;
		projectConfigFiles: Project.IConfigurationFile[];

		isIonicProject(projectDir: string): IFuture<boolean>;
		createNewProject(projectName: string, framework: string, template?: string): IFuture<void>;
		initializeProjectFromExistingFiles(framework: string, projectDir?: string, appName?: string): IFuture<void>;
		createProjectFile(projectDir: string, properties: any): IFuture<void>;
		createTemplateFolder(projectDir: string): IFuture<void>;

		getNewProjectDir(): string;
		getProjectSchema(): IFuture<any>;
		getLiveSyncUrl(): string;
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
		getPluginVariablesInfo(configuration?: string): IFuture<IDictionary<IStringDictionary>>;
	}

	interface IFrameworkProject {
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
		getPluginVariablesInfo(projectInformation: Project.IProjectInformation, projectDir?: string, configuration?: string): IFuture<IDictionary<IStringDictionary>>;
	}

	interface IFrameworkProjectBase {
		alterPropertiesForNewProjectBase(properties: any, projectName: string): void;
		getProjectFileSchemaByName(name: string): IDictionary<any>;
		getProjectTargetsBase(projectDir: string, fileMask: RegExp): IFuture<string[]>;
		printAssetUpdateMessage(): void;
		getProperty(propertyName: string, configuration: string, projectInformation: Project.IProjectInformation): any;
		/**
		 * Completes any mandatory project properties which have default values.
		 * @param  {any}	properties	object containing already parsed properties
		 * @return {boolean}			whether or not the initial properties have been updated
		 */
		completeProjectProperties(properties: any): boolean;
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

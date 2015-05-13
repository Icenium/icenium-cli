declare module Project {
	interface IProject {
		projectData: IProjectData;
		capabilities: IProjectCapabilities;
		configurationSpecificData: IDictionary<IDictionary<any>>;
		configurations: string[];
		requiredAndroidApiLevel: number;
		projectConfigFiles: Project.IConfigurationFile[];
		startPackageActivity: string;

		createNewProject(projectName: string, framework: string): IFuture<void>;
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
		printProjectProperty(property: string): IFuture<void>;
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
	}

	interface IFrameworkProject {
		name: string;
		capabilities: IProjectCapabilities;
		defaultProjectTemplate: string;
		liveSyncUrl: string;
		requiredAndroidApiLevel: number;
		configFiles: IConfigurationFile[];
		startPackageActivity: string;
		getTemplateFilename(name: string): string;
		getValidationSchemaId(): string;
		getProjectFileSchema(): IDictionary<any>;
		getProjectTargets(projectDir: string): IFuture<string[]>;
		projectTemplatesString(): IFuture<string>;
		alterPropertiesForNewProject(properties: any, projectName: string): void;
		completeProjectProperties(properties: any): boolean;
		adjustBuildProperties(buildProperties: any, projectInformation?: IProjectInformation): any;
		ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void>;
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
	}

	interface ITargetFrameworkIdentifiers {
		Cordova: string;
		NativeScript: string;
		MobileWebsite: string;
	}

	interface IConfigurationFile {
		template: string;
		filepath: string;
		templateFilepath: string;
		helpText: string;
	}
}
declare module Project {
	interface IProject {
		projectData: IProjectData;
		capabilities: IProjectCapabilities;
		projectTargets: IFuture<string[]>;
		configurationSpecificData: IDictionary<IDictionary<any>>;
		configurations: string[];
		requiredAndroidApiLevel: number;
		projectConfigFiles: Project.IConfigurationFile[];

		createNewProject(projectName: string, framework: string): IFuture<void>;
		createProjectFileFromExistingProject(framework: string): IFuture<void>;
		createProjectFile(projectDir: string, properties: any): IFuture<void>;
		createTemplateFolder(projectDir: string): IFuture<void>;
		onFrameworkVersionChanging(newVersion: string): IFuture<void>;
		hasBuildConfigurations(): boolean;

		getNewProjectDir(): string;
		getProjectSchema(): IFuture<any>;
		getLiveSyncUrl(): string;
		getProjectDir(): IFuture<string>;
		getBuildConfiguration(): string;
		getTempDir(extraSubdir?: string): IFuture<string>;
		getProperty(propertyName: string, configuration: string): any;
		getProjectTargets(): IFuture<string[]>;
		updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void>;
		printProjectProperty(property: string): IFuture<void>;
		setProperty(propertyName: string, value: any, configuration: string): void;
		validateProjectProperty(property: string, args: string[], mode: string): IFuture<boolean>;
		adjustBuildProperties(buildProperties: any): any;
		saveProject(projectDir?: string): IFuture<void>;

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
		getTemplateFilename(name: string): string;
		getProjectFileSchema(): IFuture<any>;
		getFullProjectFileSchema(): IFuture<any>;
		getProjectTargets(projectDir: string): IFuture<string[]>;
		projectTemplatesString(): IFuture<string>;
		alterPropertiesForNewProject(properties: any, projectName: string): void;
		completeProjectProperties(properties: any): boolean;
		adjustBuildProperties(buildProperties: any, projectData?: IProjectData): any;
		ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void>;
	}

	interface IFrameworkProjectBase {
		alterPropertiesForNewProjectBase(properties: any, projectName: string): void;
		getProjectFileSchemaByName(name: string): IFuture<any>;
		getFullProjectFileSchemaByName(name: string): IFuture<any>;
		getProjectTargetsBase(projectDir: string, fileMask: RegExp): IFuture<string[]>;
		printAssetUpdateMessage(): void;
	}

	interface IFrameworkProjectResolverBase {
		resolveByName<T>(name: string, framework: string): T;
	}

	interface IFrameworkProjectResolver {
		resolve(framework: string): IFrameworkProject;
	}

	interface IFrameworkSimulatorServiceResolver {
		resolve(framework: string): IProjectSimulatorService;
	}

	interface IProjectFilesManager {
		availableConfigFiles: IDictionary<Project.IConfigurationFile>;
		enumerateProjectFiles(projectDir: string, additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]>;
		isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean;
	}

	interface IProjectConstants {
		PROJECT_FILE: string;
		RELEASE_CONFIGURATION_NAME: string;
		DEBUG_CONFIGURATION_NAME: string;
		TARGET_FRAMEWORK_IDENTIFIERS: ITargetFrameworkIdentifiers;
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

declare module Server {
	interface IRequestBodyElement {
		name: string;
		value: any;
		contentType: string;
	}

	interface IServiceProxy {
		call<T>(name: string, method: string, path: string, accept: string, body: IRequestBodyElement[], resultStream: NodeJS.WritableStream, headers?: any): Promise<T>;
		setShouldAuthenticate(shouldAuthenticate: boolean): void;
	}

	interface IAppBuilderServiceProxy extends IServiceProxy {
		makeTapServiceCall<T>(call: () => Promise<T>, solutionSpaceHeaderOptions?: { discardSolutionSpaceHeader: boolean }): Promise<T>
	}

	interface IServiceContractProvider {
		getApi(path?: string): Promise<Swagger.ISwaggerServiceContract>;
	}

	interface IIdentityManager {
		listCertificates(): Promise<void>;
		listProvisions(provisionStr?: string): Promise<void>;
		findCertificate(identityStr: string): Promise<ICryptographicIdentity>;
		findProvision(provisionStr: string): Promise<IProvision>;
		autoselectProvision(appIdentifier: string, provisionTypes: string[], deviceIdentifier?: string): Promise<IProvision>;
		autoselectCertificate(provision: IProvision): Promise<ICryptographicIdentity>;
		isCertificateCompatibleWithProvision(certificate: ICryptographicIdentity, provision: IProvision): boolean;
		findReleaseCertificate(): Promise<ICryptographicIdentity>;
	}

	interface IPackageDef {
		platform: string;
		solution: string;
		solutionPath: string;
		relativePath: string;
		localFile?: string;
		disposition: string;
		format: string;
		url: string;
		fileName: string;
		key?: string;
		value?: string;
		architecture?: string;
	}

	interface IBuildResult {
		buildResults: IPackageDef[];
		output: string;
		errors: string[];
	}

	interface IKendoDownloadablePackageData {
		Id: string;
		DownloadUrl: string;
		Keywords: string[];
		Name: string;
		Version: string;
		ReleaseNotesUrl: string;
		NeedPurchase: boolean;
		VersionTags: string[];
		HasReleaseNotes: boolean;
	}
}

/**
 * Describes tenant information for a user.
 */
interface ITenant {
	/**
	 * Unique identifier of the tenant.
	 */
	id: string;

	/**
	 * Name of the tenant.
	 */
	name: string;

	/**
	 * ExpirationUtcSoft. It's written as string, but in fact it's DateTime.
	 * @example "2115-08-26T23:59:59.9999999Z"
	 */
	expSoft: string;

	/**
	 * ExpirationUtcStrict. It's written as string, but in fact it's DateTime.
	 * @example "2115-08-26T23:59:59.9999999Z"
	 */
	expStrict: string;

	/**
	 * Edition of the subscription.
	 */
	editionType: string;

	/**
	 * Is the tenant Active.
	 */
	status: string;

	/**
	 * Available project slots.
	 */
	projectSlots: number;

	/**
	 * License
	 */
	license: string;

	/**
	 * Available features. The value for each of them shows if user can use them.
	 */
	features: IDictionary<boolean>;
}

/**
 * Describes AppBuilder User.
 */
interface IUser {
	/**
	 * Email of the user.
	 */
	email: string;

	/**
	 * Unique identifier of the user.
	 */
	uid: string;

	/**
	 * Name of the user.
	 */
	name: string;

	/**
	 * Has agreed to eula.
	 */
	eula: boolean;

	/**
	 * Tenant information.
	 */
	tenant: ITenant;
}

interface IUserDataStore {
	hasCookie(): Promise<boolean>;
	getCookies(): Promise<IStringDictionary>;
	getUser(): Promise<IUser>;
	setCookies(cookies?: IStringDictionary): void;
	parseAndSetCookies(setCookieHeader: any, cookies?: IStringDictionary): void;
	setUser(user?: IUser): Promise<void>;
	clearLoginData(): Promise<void>;
}

interface ILoginManager {
	login(): Promise<void>;
	logout(): Promise<void>;
	isLoggedIn(): Promise<boolean>;
	ensureLoggedIn(): Promise<void>;
	telerikLogin(user: string, password: string): Promise<void>;
}

declare module Server.Contract {
	interface IParameter {
		name: string;
		binding: {
			type: string;
			contentType: string;
		}
		routePrefixes: string[];
		routeSuffixes: string[];
	}

	interface IOperation {
		name: string;
		actionName: string;
		httpMethod: string;
		responseType: string;
		routePrefixes: string[];
		routeSuffixes: string[];
		parameters: IParameter[];
	}

	interface IService {
		name: string;
		endpoint: string;
		operations: IOperation[];
	}
}

declare module Project {
	interface IBuildResult {
		buildProperties: any;
		packageDefs: Server.IPackageDef[];
		provisionType?: string;
	}

	interface IBuildPropertiesAdjustment {
		adjustBuildProperties(oldBuildProperties: any): any;
	}

	interface IBuildService {
		getDownloadUrl(urlKind: string, liveSyncToken: string, packageDef: Server.IPackageDef, projectConfiguration: string): Promise<string>;
		executeBuild(platform: string, opts?: { buildForiOSSimulator?: boolean }): Promise<void>;
		build(settings: IBuildSettings): Promise<Server.IPackageDef[]>;
		buildForDeploy(platform: string, downloadedFilePath: string, buildForiOSSimulator?: boolean, device?: Mobile.IDevice): Promise<IApplicationInformation>;
		buildForiOSSimulator(downloadedFilePath: string, device?: Mobile.IDevice): Promise<string>;
	}

	interface IBuildSettings {
		platform: string;
		projectConfiguration?: string;
		buildConfiguration?: string;
		showQrCodes?: boolean;
		downloadFiles?: boolean;
		downloadedFilePath?: string;

		provisionTypes?: string[];
		device?: Mobile.IDevice;

		buildForiOSSimulator?: boolean;
		showWp8SigningMessage?: boolean;
		buildForTAM?: boolean;
	}

	interface IProjectMigrationService {
		migrateTypeScriptProject(): Promise<void>;
	}
}

interface IProjectTypes {
	Cordova: number;
	NativeScript: number;
	Common: number;
}

interface IProjectPropertiesService {
	/**
	 * Gets all project properties.
	 * @param {string} projectFile The path to projectFile (.abproject or package.json).
	 * @param {boolean} isJsonProjectFile Boolean value indicating if the content of the project is JSON. In case this value is set to false, the project file is read as xml.
	 * @param {Project.IFrameworkProject} frameworkProject The specified project (Cordova or NativeScript) instance.
	 * @returns {Project.IData} Project settings.
	 */
	getProjectProperties(projectFile: string, isJsonProjectFile: boolean, frameworkProject: Project.IFrameworkProject): Project.IData;

	completeProjectProperties(properties: any, frameworkProject: Project.IFrameworkProject): boolean;
	updateProjectProperty(projectData: any, configurationSpecificData: Project.IData, mode: string, property: string, newValue: any): Promise<void>;
	normalizePropertyName(property: string, projectData: Project.IData): string;
	getValidValuesForProperty(propData: any): Promise<string[]>;
	getPropertiesForAllSupportedProjects(): Promise<string>;
	/**
	 * Removes property from the project and validates the result data.  If it is configuration specific (commonly written in .debug.abproject or .release.abproject)
	 * you have to pass the projectData as last parameter of the method.
	 * @param {IData} dataToBeUpdated The data from which to remove the property.
	 * @param {string} propertyName The name of the property that should be removed from the data.
	 * @param {IData} projectData Optional parameter. The project data, commonly written in .abproject. Set this property whenever you want to remove property from configuration specific data.
	 * @return {IData} Modified data. In case configurationSpecificData exists, returns it, else returns projectData.
	 * @throws Error when the modified data cannot be validated with the respective JSON schema. In this case the modification is not saved to the file.
	 */
	removeProjectProperty(dataToBeUpdated: Project.IData, property: string, projectData?: Project.IData): Project.IData;

	/**
	 * Updates CorePlugins property value in all configurations.
	 * @param {IData} projectData The project data commonly written in .abproject.
	 * @param {IDictionary<IData>} configurationSpecificData Dictionary with all configuration specific data.
	 * @param {string} mode Type of operation which should be executed with the property.
	 * @param {Array<any>} newValue The new value that should be used for CorePlugins modification.
	 * @param {string[]} configurationsSpecifiedByUser The configurations which the user want to modify.
	 * @return {Promise<void>}
	 * @throws Error when the modified data cannot be validated with the respective JSON schema. In this case the modification is not saved to the file.
	 * @throws Error when the different CorePlugins are enabled in projectData and any configuration specific data.
	 */
	updateCorePlugins(projectData: Project.IData, configurationSpecificData: IDictionary<Project.IData>, mode: string, newValue: Array<any>, configurationsSpecifiedByUser: string[]): Promise<void>
}

interface IServerConfigurationData {
	assemblyVersion: string;
	applicationName: string;
	backendServiceScheme: string;
	stsServer: string;
	clientId: string;
	analyticsAccountCode: string;
	eqatecProductId: string;
}

interface IConfiguration extends Config.IConfig {
	DEFAULT_CORDOVA_PROJECT_TEMPLATE: string;
	DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE: string;
	CORDOVA_PLUGINS_REGISTRY: string;
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;
	AUTO_UPGRADE_PROJECT_FILE: boolean;
	TYPESCRIPT_COMPILER_OPTIONS: ITypeScriptCompilerOptions;

	/**
	 * Resets config.json to it's default values.
	 * @returns {void}
	 */
	reset(): void;

	/**
	 * Applies specific configuration and saves it in config.json
	 * @param {string} configName The name of the configuration to be applied.
	 * @returns {void}
	 */
	apply(configName: string): void;
	printConfigData(): void;
}

interface IStaticConfig extends Config.IStaticConfig {
	/**
	 * The full path to the file, which contains GitHub access token used for GitHub api calls.
	 */
	GITHUB_ACCESS_TOKEN_FILEPATH: string;
	QR_SIZE: number;
	SOLUTION_SPACE_NAME: string;
	triggerJsonSchemaValidation: boolean;
}

interface IDependencyConfigService {
	dependencyConfigFilePath: string;
	getAppScaffoldingConfig(): IAppScaffoldingConfig;
	getAllGenerators(): IGeneratorConfig[];
	getGeneratorConfig(generatorName: string): IGeneratorConfig;
}

interface IServerConfiguration {
	tfisServer(): Promise<string>;
	assemblyVersion(): Promise<string>;
	resourcesPath(): Promise<string>;
}

interface IExtensionPlatformServices extends IRunValidator {
	packageName: string;
	executableName: string;
	runApplication(applicationPath: string, applicationParams: string[]): void;
}

interface IDebuggerService {
	debugAndroidApplication(applicationId: string, framework: string): Promise<void>;
	debugIosApplication(applicationId: string): void;
}

interface IRunValidator {
	canRunApplication(): Promise<boolean>;
}

interface IX509Certificate {
	issuerData: any;
	issuedOn: Date;
	expiresOn: Date;
}

interface IX509CertificateLoader {
	load(certificatePem: string): IX509Certificate;
}

interface IQrCodeGenerator {
	generateDataUri(data: string): Promise<string>;
}

interface IPackageDownloadLink {
	packageUrl: string;
	downloadText: string;
}

interface IPackageDownloadViewModel {
	qrUrl?: string;
	qrImageData: string;
	instruction: string;
	packageUrls?: IPackageDownloadLink[];
}

/**
 * Used to download resources from the server
 */
interface IResourceDownloader {
	/**
	 * Download all cordova javascript fies - Android, iOS and WP8
	 * @return {Promise<void>}
	 */
	downloadCordovaJsFiles(): Promise<void>;
	/**
	 * Download a specific resource from the server
	 * @param  {string}        remotePath the path to the resource on the remote server
	 * @param  {string}        targetPath the path where the resource is written
	 * @return {Promise<void>}
	 */
	downloadResourceFromServer(remotePath: string, targetPath: string): Promise<void>;
	/**
	 * Download image definitions json file from the server
	 * @return {Promise<void>}
	 */
	downloadImageDefinitions(): Promise<void>;
}

interface IUserSettingsFileService {
	/**
	 * Deletes the user settings file.
	 */
	deleteUserSettingsFile(): void;
	userSettingsFilePath: string;
}

interface IDependencyConfig {
	name: string;
	version: string;
	gitHubRepoUrl: string;
	downloadUrl?: string;
	pathToSave?: string;
}

interface IAppScaffoldingConfig extends IDependencyConfig { }

interface IGeneratorConfig extends IDependencyConfig {
	alias: string;
}

interface IExtensionsServiceBase {
	getExtensionVersion(packageName: string): string;
	getExtensionPath(packageName: string): string;
	cacheDir: string;
}

interface IServerExtensionsService extends IExtensionsServiceBase {
	prepareExtension(packageName: string, beforeDownloadPackageAction: () => void): Promise<void>;
}

interface IAppScaffoldingExtensionsService {
	appScaffoldingPath: string;
	prepareAppScaffolding(afterPrepareAction?: () => void): Promise<void>;
}

interface IScreenBuilderService {
	generatorFullName: string;
	commandsPrefix: string;
	screenBuilderSpecificFiles: string[];
	prepareAndGeneratePrompt(projectPath: string, generatorName?: string, screenBuilderOptions?: IScreenBuilderOptions): Promise<boolean>;
	allSupportedCommands(projectPath: string, generatorName?: string): Promise<string[]>;
	generateAllCommands(projectPath: string, generatorName?: string): Promise<void>;

	/**
	 * Gets answers of all screenBuilder questions from specified JSON file.
	 * @param {string} answers Path to file containing the answers.
	 * @param {IScreenBuilderOptions} basic ScreenBuilder options.
	 * @returns {IScreenBuilderOptions}
	 */
	composeScreenBuilderOptions(answers: string, basicSceenBuilderOptions?: IScreenBuilderOptions): IScreenBuilderOptions;

	/**
	 * Checks if current project is created with ScreenBuilder. In case it's not, an error is thrown.
	 * @param {string} projectPath Path to project that will be checked.
	 */
	ensureScreenBuilderProject(projectPath: string): void;
	shouldUpgrade(projectPath: string): Promise<boolean>;
	upgrade(projectPath: string): Promise<void>;
}

/**
 * Defines a DTO for migrating from older versions of Screen Builder to the newest one.
 */
interface IScreenBuilderMigrationData {
	/**
	 * States whether the app is already at the latest Screen Builder version.
	 * @type {boolean}
	 */
	wasMigrated: boolean;
	/**
	 * States whether the user chose to upgrade the app to the latest Screen Builder version.
	 * @type {boolean}
	 */
	didMigrate: boolean;
}

interface IScreenBuilderOptions {
	type?: string;
	answers?: IScreenBuilderAnswer;
	projectPath?: string;
	/**
	 * States whether the ScreenBuilder command is synchronous. If it is then no callback will be passed to the app-scaffolder package.
	 * @type {boolean}
	 */
	isSync?: boolean;
}

interface IScreenBuilderAnswer {
	name?: string;
}

interface IExtensionData {
	packageName: string;
	version: string;
	downloadUri: string;
	pathToSave?: string;
	forceDownload?: boolean;
}

/**
 * Defines methods required for migrating Cordova or NativeScript projects.
 */
interface IFrameworkMigrationService {
	/**
	 * Downloads the data that is required in order to be able to migrate any project.
	 * @return {Promise<void>}
	 */
	downloadMigrationData(): Promise<void>;

	/**
	 * Downloads the configuration file which contains information about migrating project.
	 * @param  {string} the directory in which to save the file.
	 * @return {Promise<void>}
	 */
	downloadMigrationConfigFile(targetPath?: string): Promise<void>;

	/**
	 * Gives a list of all supported versions. Each version is a string in the following format <Major>.<Minor>.<Patch>
	 * @return {string[]} List of all supported versions.
	 */
	getSupportedVersions(): string[];

	/**
	 * Gives a list of all supported framework versions. Each one is presented with version and user-friendly display name.
	 * @return {IFrameworkVersion[]} List of all supported frameworks, each one with version and display name.
	 */
	getSupportedFrameworks(): IFrameworkVersion[];

	/**
	 * Gets the user-friendly name of the specified version.
	 * @param  {string} version The version of the framework.
	 * @return {string} User-friendly name of the specified version.
	 */
	getDisplayNameForVersion(version: string): string;

	/**
	 * Hook which is dynamically called when a project's framework version is changing
	 * @param  {string} newVersion The version to upgrade/downgrade to
	 * @return {Promise<void>}
	 */
	onFrameworkVersionChanging(newVersion: string): Promise<void>;
}

/**
 * Defines methods required for migrating Cordova projects.
 */
interface ICordovaMigrationService extends IFrameworkMigrationService {
	/**
	 * Get all plugins available for specified version.
	 * @param {string} version The Cordova Framework version.
	 * @return {string[]} plugins available for the selected Cordova version
	 */
	pluginsForVersion(version: string): string[];
	/**
	 * Migrate plugins from one Cordova version to another.
	 * @param {string} fromVersion The current Cordova Framework version.
	 * @param {string} toVersion The Cordova Framework version to be used.
	 * @return {string[]} Migrated plugins.
	 */
	migratePlugins(plugins: string[], fromVersion: string, toVersion: string): Promise<string[]>;
	/**
	 * Hook which is dynamically called when a project's windows phone sdk version is changing
	 * @param  {string} newVersion The version to upgrade/downgrade to
	 * @return {Promise<void>}
	 */
	onWPSdkVersionChanging?(newVersion: string): Promise<void>;
}

/**
 * Defines a DTO helper object for migrations
 */
interface INativeScriptMigrationConfiguration {
	tnsModulesProjectPath: string;
	tnsTypingsPath: string;
	packageJsonContents: any;

	tnsModulesBackupName: string;
	typingsBackupName: string;
	oldPackageJsonContents: any;

	pathToPackageJson: string;
	projectDir: string;
	appResourcesRequiredPath: string;

	shouldRollBackAppResources: boolean;
}

/**
 * Defines data that is comming from server
 */
interface ICordovaJsonData {
	deletedVersions: any;
	supportedVersions: any;
	minVersionsPerPlatform: any;
	minimumSupportedVersion: string;
	corePluginsMinimumVersion: string;
	forceHardwareAccelerationAfter: string;
	corePluginRegex: any;
	defaultEnabledPluginsIncludeRegex: string;
	defaultEnabledPluginsExcludeRegex: string;
	renamedPlugins: any;
}

interface ISamplesService {
	cloneSample(sampleName: string): Promise<void>;
	printSamplesInformation(framework?: string): Promise<void>;
}

interface IExpress {
	run(): void;
	listen(port: number, callback?: Function): any;
	post(route: string, callback: (req: any, res: any) => Promise<void>): void;
}

interface IDomainNameSystem {
	getDomains(): Promise<string[]>;
}

interface ICordovaPluginsService {
	getAvailablePlugins(): Promise<Server.CordovaPluginData[]>;
	createPluginData(plugin: any): Promise<IPlugin[]>;
}

/**
 * Defines methods required to work with plugins.
 */
interface IPluginsService {
	/**
	 * Method which will initialize the service.
	 * @return {Promise<void>}
	 */
	init(): Promise<void>;

	/**
	 * Gets all available plugins for the current project type.
	 * NOTE: For NativeScript projects the count of listed NPM packages and NPM plugins is controlled
	 * via pluginsCount parameter.
	 * @param {number} pluginsCount - number of NPM packages and NativeScript NPM Plugins to be shown.
	 * The count is for each of the groups separately.
	 * @return {Promise<IPlugin[]>} - Array of plugins found.
	 */
	getAvailablePlugins(pluginsCount?: number): Promise<IPlugin[]>;

	/**
	 * Provides information about all installed plugins.
	 * @return {Promise<IPlugin[]>} Array of all installed plugins and information about each of them.
	 */
	getInstalledPlugins(): Promise<IPlugin[]>;

	/**
	 * Shows information about specified plugins.
	 * @param {IPlugin[]} plugins Array of plugins that will be printed.
	 * @return {Promise<void>}
	 */
	printPlugins(plugins: IPlugin[]): Promise<void>;

	/**
	 * Adds plugin to the current project, so it can be used in the application.
	 * @param {string} pluginName The name of the plugin that has to be added. It can contains the required version.
	 * For example these are valid names: "lodash", "lodash@3.10.1"
	 * @return {Promise<void>}
	 */
	addPlugin(pluginName: string): Promise<void>;

	/**
	 * Removes plugin from the current project.
	 * @param {string} pluginName The name of the plugin that has to be removed.
	 * @return {Promise<void>}
	 */
	removePlugin(pluginName: string): Promise<void>;

	/**
	 * Used to configure a plugin.
	 * @param  {string}        pluginName     The name of the plugin.
	 * @param  {string}        version        The version of the plugin.
	 * @param  {string[]}      configurations Configurations in which the plugin should be configured. Example: ['debug'], ['debug', 'release']
	 * @return {Promise<void>}
	 */
	configurePlugin(pluginName: string, version?: string, configurations?: string[]): Promise<void>;

	/**
	 * Checks if the specified plugin is installed for the current project.
	 * @param {string} pluginName The name of the plugin which has to be checked. It can contain the required version.
	 * For example these are valid names: "lodash", "lodash@3.10.1"
	 * @return {Promise<boolean>} 'true' in case the plugin with specified version is installed, false otherwise.
	 */
	isPluginInstalled(pluginName: string): Promise<boolean>;
	/**
	 * Returns basic information about the plugin - it's name, version and cordova version range
	 * @param  {string}                  pluginName The name of the plugin
	 * @return {Promise<IBasicPluginInformation>}            Basic information about the plugin
	 */
	getPluginBasicInformation(pluginName: string): Promise<IBasicPluginInformation>;

	/**
	 * Copies the source code of a plugin inside the project and adds it as a reference, so it can be used within the application.
	 * @param {string} pluginIdentifier The identifier of the plugin that will be copied to the source code.
	 * @return {Promise<string>} The name of the fetched plugin.
	 */
	fetch(pluginIdentifiers: string): Promise<string>;

	/**
	 * Search for plugins based on specified keywords and returns plugins source which contains methods for working with the result.
	 * @param {string[]} keywords Array of keywords that will be used for searching.
	 * @return {IPluginsSource} Plugins source which contains methods for working with the result.
	 */
	findPlugins(keywords: string[]): Promise<IPluginsSource>;

	/**
	 * Filters plugin based on framework specific rules.
	 * @param {IPlugin[]} plugins Array of plugins to be filtered.
	 * @return {Promise<IPlugin[]>} Plugins that pass the filter.
	 */
	filterPlugins(plugins: IPlugin[]): Promise<IPlugin[]>;
}

interface IPlugin {
	data: IPluginInfoBase;
	type: any;
	configurations: string[];
	pluginInformation: string[];
	toProjectDataRecord(version?: string): string;
}

/**
 * Describes information about one plugin variable.
 * In NativeScript project the variable is described in plugin's package.json with name and object as value.
 * @example
 * {
 *    "name": "my-plugin",
 *    "version": "1.0.0",
 *    "nativescript": {
 *        "variables": {
 *           "my-var": {
 *              "default": "defaultValue"
 *           }
 *        }
 *    }
 * }
 */
interface INativeScriptPluginVariable {
	/**
	 * The default value of the variable that will be used in case user does not specify value for the variable.
	 * @optional
	 */
	defaultValue?: string;
}

/**
 * Describes basic information for each plugin.
 */
interface IPluginInfoBase {
	/**
	 * Authors of the plugin provided as string array.
	 */
	Authors: string[];

	/**
	 * Supported framework versions, commonly declared as range, for ex. '>=1.3.0' or '>3.5.0'.
	 */
	SupportedVersion: string;

	/**
	 * Name of the plugin.
	 */
	Name: string;

	/**
	 * Current plugin version.
	 */
	Version: string;

	/**
	 * Basic explanation what is this plugin used for.
	 */
	Description: string;

	/**
	 * Url to github or homepage of the plugin.
	 */
	Url: string;

	/**
	 * Mobile platforms that can use this plugin, for example ['ios', 'android'].
	 */
	Platforms: string[];

	/**
	 * Plugin specific identifier. It can differ from plugin's name.
	 */
	Identifier: string;

	/**
	 * Variables that have to be set in the application in order to be able to use the plugin correctly.
	 */
	Variables?: string[] | IDictionary<INativeScriptPluginVariable>;
}

interface IPluginVersion {
	/**
	 * The name of the plugin
	 * @type {string}
	 */
	name: string;
	/**
	 * The plugin's version
	 * @type {string}
	 */
	value: string;
	/**
	 * The cordova version range this plugin supports
	 * Example: >=3.5.0, <3.7.0, 4.0.0, >=3.0.0 && <4.0.0
	 * @type {string}
	 */
	cordovaVersionRange: string;
}

/**
 * Extends Server's MarketplacePluginVersionsData interface.
 */
interface IMarketplacePluginVersionsData extends Server.MarketplacePluginVersionsData {
	/**
	 * The version of the plugin, that is marked as default. This version may not be the latest version.
	 */
	DefaultVersion: string;
	/**
	 * Id of the plugin.
	 */
	Identifier: string;
	/**
	 * The framework that is required in order to work with this plugin.
	 */
	Framework: string;
}

/**
 * Should be the same as Server's MarketplacePluginVersionsDataBase
 */
interface IMarketplacePluginVersionsDataBase {
	/**
	 * Information for each available version of the plugin.
	 */
	Versions: IMarketplacePluginData[];

	/**
	 * Unique plugin id.
	 */
	Identifier: string;

	/**
	 * The default version of the plugin that will be used in case the user does not specify another one.
	 */
	DefaultVersion: string;

	/**
	 * Mobile framework that can use this plugin, for example 'Cordova' or 'NativeScript'.
	 */
	Framework: string;
}

/**
 * Should be the same as Server's class IMarketplacePluginData/CordovaMarketplacePluginData
 */
interface IMarketplacePluginData extends IPluginInfoBase {
	/**
	 * The author of the plugin, Telerik or Telerik Partner in most of the cases.
	 */
	Publisher: Server.MarketplacePluginPublisher;

	/**
	 * Number of downloads of the plugin.
	 */
	DownloadsCount: number;

	/**
	 * Assets
	 */
	Assets?: string[];

	/**
	 * Permissions that has to be approved by user when the application is used on Android
	 * in order to use the plugin.
	 */
	AndroidRequiredPermissions?: string[];
}

interface IMarketplacePlugin extends IPlugin {
	pluginVersionsData: IMarketplacePluginVersionsData;
}

interface IProcessInfo {
	isRunning(name: string): Promise<boolean>;
}

interface IRemoteProjectService {
	getProjectProperties(solutionName: string, projectName: string): Promise<any>;
	getProjectsForSolution(solutionId: string): Promise<Server.IWorkspaceItemData[]>;
	getProjectName(solutionId: string, projectId: string): Promise<string>;
	exportProject(remoteSolutionName: string, remoteProjectName: string): Promise<void>;
	exportSolution(remoteSolutionName: string): Promise<void>;
	getAvailableAppsAndSolutions(): Promise<ITapAppData[]>;
	getSolutionData(propertyValue: string): Promise<Server.SolutionData>;
}

interface IProjectSimulatorService {
	getSimulatorParams(simulatorPackageName: string): Promise<string[]>;
}

interface ILiveSyncService {
	livesync(platform?: string): Promise<void>;
}

interface IAppManagerService {
	upload(platform: string): Promise<void>;
	openAppManagerStore(): void;
	publishLivePatch(platforms: string[]): Promise<void>;
	getGroups(): Promise<void>;
}

interface IDynamicSubCommandInfo {
	baseCommandName: string;
	filePath: string;
	commandConstructor: Function;
}

interface IKendoUIService {
	getKendoPackages(options: IKendoUIFilterOptions): Promise<Server.IKendoDownloadablePackageData[]>;
}

interface IPublishService {
	publish(idOrUrl: string, username: string, password: string): Promise<void>;
	listAllConnections(): void;
	addConnection(name: string, publishUrl: string): Promise<void>;
	removeConnection(idOrName: string): Promise<void>;
}

interface IPublishConnection extends IStringDictionary {
	type: string;
	publicUrl: string;
	publishUrl: string;
	name: string;
}

/**
 * Represents all supported options.
 */
interface IOptions extends ICommonOptions {
	all: boolean;
	answers: string;
	available: boolean;
	certificate: string;
	companion: boolean;
	core: boolean;
	count: number;
	deploy: string;
	device: string;
	deviceType: string;
	download: boolean;
	force: boolean;
	group: string[];
	icon: string;
	latest: boolean;
	mandatory: boolean;
	professional: boolean;
	provision: string;
	public: boolean;
	publish: boolean;
	saveTo: string;
	screenBuilderCacheDir: string;
	sendEmail: boolean;
	sendPush: boolean;
	simulator: boolean;
	/**
	 * Used in edit-configuration command. When passed, command will generate the file on the specified place, but will NOT open the default editor for this file.
	 * Required for some automated tests.
	 */
	skipUi: boolean;
	splash: string;
	template: string;
	types: boolean;
	validValue: boolean;
	verified: boolean;
}

/**
 * Describes options with which kendo ui packages can be filtered
 */
interface IKendoUIFilterOptions {
	verified: boolean;
	core: boolean;
	professional: boolean;
	latest: boolean;
	withReleaseNotesOnly: boolean;
}

/**
 * Describes the migration data for NativeScript project.
 * This data is written in resource file.
 */
interface INativeScriptMigrationData {
	/**
	 * Versions that cannot be used for building the project and cannot be migrated to other ones.
	 */
	deletedVersions: IFrameworkVersion[];
	/**
	 * Versions that can be used for building the project and it can be migrated between them.
	 */
	supportedVersions: IFrameworkVersion[];
	/**
	 * Versions that are deprecated.
	 */
	deprecatedVersions: IFrameworkVersion[];
}

/**
 * Describes framework version with valid version and its display name.
 */
interface IFrameworkVersion {
	/**
	 * The version in format <Major>.<Minor>.<Patch>
	 */
	version: string;
	/**
	 * User friendly name, describing the version.
	 */
	displayName: string;
	/**
	 * Version string for tns-core-modules dependency
	 */
	modulesVersion?: string;
}

/**
 * Describes WebViewService
 */
interface IWebViewService {
	supportedWebViews: IDictionary<IWebView[]>;
	getWebView(platform: string, webViewName: string, frameworkVersion: string): IWebView;
	getWebViews(platform: string): IWebView[];
	getWebViewNames(platform: string): string[];
	enableWebView(platform: string, webViewName: string, frameworkVersion: string): Promise<void>;
	getCurrentWebViewName(platform: string): Promise<string>;
}

/**
 * Describes WebView with name minSupportedVersion and pluginIdentifier.
 */
interface IWebView {
	name: string;
	minSupportedVersion: string;
	pluginIdentifier?: string;
	default?: boolean;
	frameworkVersionCondition?: string;
}

/**
 * Service for interaction with the simulator
 */
interface ISimulatorService {
	/**
	 * Used to start simulator
	 * @return {Promise<void>}
	 */
	launchSimulator(): Promise<void>;
}


/**
 * Used to manage images
 */
interface IImageService {
	/**
	 * Print image definitions
	 */
	printDefinitions(): void;
	/**
	 * Generate images and save them to the project
	 * @param  {string}           initialImagePath hi-res image from which to generate all the others
	 * @param  {Server.ImageType} imageType        Icon or Splashscreen
	 * @param  {boolean}          force            whether to overwrite conflicting images
	 * @return {Promise<void>}
	 */
	generateImages(initialImagePath: string, imageType: Server.ImageType, force: boolean): Promise<void>;
	/**
	 * Prompt the user for more information about image generation
	 * @param  {boolean}       force whether to overwrite conflicting images
	 * @return {Promise<void>}
	 */
	promptForImageInformation(force: boolean): Promise<void>;
}

/**
 * The backend of 'remote' command.
 * Listens on an API endpoint to launch ios simulator
 */
interface IRemoteService {
	/**
	 * Listens on an API endpoint to launch ios simulator
	 * @param portNumber
	 */
	startApiServer(portNumber: number): Promise<void>;
}

/**
 *	Used for managing cordova-related resources
 */
interface ICordovaResourceLoader {
	/**
	 * Builds the absolute path to a Cordova javascript file.
	 * @param  {string} version  The Cordova version
	 * @param  {string} platform The Platform - Android, iOS or WP8
	 * @return {string} Absolute path to Cordova javascript file
	 */
	buildCordovaJsFilePath(version: string, platform: string): string;

	/**
	 * Reads the content of cordova-migration-data.json and returns it as JavaScript object.
	 * @return {ICordovaJsonData} The content of cordova-migration-data.json parsed as JavaScript object.
	 */
	getCordovaMigrationData(): ICordovaJsonData;
}

/**
 * Interact with iTunes Connect store
 */
interface IAppStoreService {
	/**
	 * Upload to itunes connect
	 * @param userName
	 * @param password
	 * @param application
	 */
	upload(userName: string, password: string, application: string): Promise<void>;

	/**
	 * Query the server for applications ready to upload to itunes connect
	 * @param userName
	 * @param password
	 */
	getApplicationsReadyForUpload(userName: string, password: string): Promise<Server.Application[]>;
}


/**
 *	Used for communicating with screenbuilder generators
 */
interface IScaffolder {
	scaffolder: any;
	promise: Promise<any>;
	callback: Function;
}

/**
 * Describes common variables in AppBuilder CLI's resources related to
 * NativeScript projects.
 */
interface INativeScriptResources {
	/**
	 * The root folder where AppBuilder CLI will place all NativeScript default resources.
	 */
	nativeScriptResourcesDir: string;

	/**
	 * The path to default package.json file, which can be used when we have to generate package.json for the user.
	 */
	nativeScriptDefaultPackageJsonFile: string;

	/**
	 * The path to nativescript-migration-data.json, which contains useful information for migration between
	 * different NativeScript versions.
	 */
	nativeScriptMigrationFile: string;
}

/**
 * Describes information for applications returned by TAP
 */
interface ITapAppData {
	/**
	 * AccountId of the owner of the project.
	 */
	accountId: string;

	/**
	 * Platform application Identifier.
	 */
	id: string;

	/**
	 * Type of the application (Hybrid, Native, etc.).
	 */
	type: string;

	/**
	 * Specific settings of the application.
	 */
	settings: any;

	/**
	 * Unique name of the application.
	 * NOTE: It is unique in the context of applications only. Old Solutions and new apps may have the same name.
	 */
	name: string;

	/**
	 * Description of the application.
	 */
	description: string;

	/**
	 * The name that can be used by the users when they want to specify app for export.
	 * This property is set client side, it does not exist in TAP.
	 */
	displayName: string;

	/**
	 * The name that will be shown to the users in the prompter.
	 * This property is set client side, it does not exist in TAP.
	 */
	colorizedDisplayName: string;

	/**
	 * Indicates if the application is migrated (true) or not (false).
	 * This property is set client side, it does not exist in TAP.
	 */
	isApp: boolean;
}

/**
 * Describes methods for transforming Ionic projects.
 */
interface IIonicProjectTransformator {
	/**
	 * Creates AppBuilder project from Ionic project by removing unnecesary files, copying the resources and parsing the Ionic config.xml file.
	 */
	transformToAppBuilderProject(createBackup: boolean): Promise<void>
}

/**
 * Describes methods for working with the clipboard.
 */
interface IClipboardService {
	/**
	 * Replaces the current contents of the clipboard.
	 * @param {string} text to place in the clipboard.
	 * @return {string} the same value passed in.
	 */
	copy(text: string): Promise<string>;

	/**
	 * Returns the current contents of the system clipboard.
	 * @return {string} the current contents of the system clipboard.
	 */
	paste(): Promise<string>;
}

/**
 * Plugin options required when installing local plugin to project.
 */
interface ILocalPluginData {
	/**
	 * The actual directory that user has entered.
	 */
	actualName: string;

	/**
	 * Is the plugin a tgz file.
	 */
	isTgz: boolean;

	/**
	 * If true the plugin will be added to the configuration file of the project.
	 */
	addPluginToConfigFile: boolean;

	/**
	 * Custom properties to be added to the configuration file of the project.
	 */
	configFileContents?: any;

	/**
	 * If true the message where the plugin is installed will not be displayed.
	 */
	suppressMessage?: boolean;
}

declare module NpmPlugins {
	/**
	 * Describes options for fetching local plugin.
	 */
	interface IFetchLocalPluginOptions {
		/**
		 * Use the original plugin directory instead of the one in Temp.
		 */
		useOriginalPluginDirectory: boolean;

		/**
		 * The original directory of the local plugin.
		 */
		originalPluginDirectory?: string;
	}

	/**
	 * Describes the format of the result returned from http://registry.npmjs.org/[plugin-name].
	 */
	interface INpmRegistryResult {
		_id: string;
		name: string;
		description: string;
		versions: IDictionary<IBasicPluginInformation>;
	}

	/**
	 * Describes data which is required to copy local plugin.
	 */
	interface ICopyLocalPluginData {
		sourceDirectory: string;
		destinationDirectory: string;
	}
}

interface IDateProvider {
	getCurrentDate(): Date;
}

/**
 * Describes information about application package.
 */
interface IApplicationInformation {
	/**
	 * The name of the package file.
	 */
	packageName: string;

	/**
	 * The identifier of the application.
	 */
	appIdentifier: string;
}

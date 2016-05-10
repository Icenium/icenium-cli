
declare module Server {
	interface IRequestBodyElement {
		name: string;
		value: any;
		contentType: string;
	}

	interface IServiceProxy {
		call<T>(name: string, method: string, path: string, accept: string, body: IRequestBodyElement[], resultStream: NodeJS.WritableStream, headers?: any): IFuture<T>;
		setShouldAuthenticate(shouldAuthenticate: boolean): void;
	}

	interface IAppBuilderServiceProxy extends IServiceProxy {
		makeTapServiceCall<T>(call: () => IFuture<T>, solutionSpaceHeaderOptions?: { discardSolutionSpaceHeader: boolean }): IFuture<T>
	}

	interface IServiceContractProvider {
		getApi(path?: string): IFuture<Swagger.ISwaggerServiceContract>;
	}

	interface IIdentityManager {
		listCertificates(): IFuture<void>;
		listProvisions(provisionStr?: string): IFuture<void>;
		findCertificate(identityStr: string): IFuture<ICryptographicIdentity>;
		findProvision(provisionStr: string): IFuture<IProvision>;
		autoselectProvision(appIdentifier: string, provisionTypes: string[], deviceIdentifier?: string): IFuture<IProvision>;
		autoselectCertificate(provision: IProvision): IFuture<ICryptographicIdentity>;
		isCertificateCompatibleWithProvision(certificate: ICryptographicIdentity, provision: IProvision): boolean;
		findReleaseCertificate(): IFuture<ICryptographicIdentity>;
	}

	interface IPackageDef {
		platform: string;
		solution: string;
		solutionPath: string;
		relativePath: string;
		localFile?: string;
		disposition: string;
		format: string;
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
	hasCookie(): IFuture<boolean>;
	getCookies(): IFuture<IStringDictionary>;
	getUser(): IFuture<IUser>;
	setCookies(cookies?: IStringDictionary): IFuture<void>;
	parseAndSetCookies(setCookieHeader: any, cookies?: IStringDictionary): IFuture<void>;
	setUser(user?: IUser): IFuture<void>;
	clearLoginData(): IFuture<void>;
}

interface ILoginManager {
	login(): IFuture<void>;
	logout(): IFuture<void>;
	isLoggedIn(): IFuture<boolean>;
	ensureLoggedIn(): IFuture<void>;
	telerikLogin(user: string, password: string): IFuture<void>;
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
		getLiveSyncUrl(urlKind: string, filesystemPath: string, liveSyncToken: string): IFuture<string>;
		executeBuild(platform: string, opts?: { buildForiOSSimulator?: boolean }): IFuture<void>;
		build(settings: IBuildSettings): IFuture<Server.IPackageDef[]>;
		buildForDeploy(platform: string, downloadedFilePath: string, buildForiOSSimulator?: boolean, device?: Mobile.IDevice): IFuture<string>;
		buildForiOSSimulator(downloadedFilePath: string, device?: Mobile.IDevice): IFuture<string>;
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

	interface IPlatformMigrator {
		ensureAllPlatformAssets(): IFuture<void>;
	}
}

interface IProjectTypes {
	Cordova: number;
	NativeScript: number;
	Common: number;
}

interface IProjectPropertiesService {
	getProjectProperties(projectFile: string, isJsonProjectFile: boolean, frameworkProject: Project.IFrameworkProject): IFuture<Project.IData>;
	completeProjectProperties(properties: any, frameworkProject: Project.IFrameworkProject): boolean;
	updateProjectProperty(projectData: any, configurationSpecificData: Project.IData, mode: string, property: string, newValue: any): IFuture<void>;
	normalizePropertyName(property: string, projectData: Project.IData): string;
	getValidValuesForProperty(propData: any): IFuture<string[]>;
	getPropertiesForAllSupportedProjects(): IFuture<string>;
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
	 * @return {IFuture<void>}
	 * @throws Error when the modified data cannot be validated with the respective JSON schema. In this case the modification is not saved to the file.
	 * @throws Error when the different CorePlugins are enabled in projectData and any configuration specific data.
	 */
	updateCorePlugins(projectData: Project.IData, configurationSpecificData: IDictionary<Project.IData>, mode: string, newValue: Array<any>, configurationsSpecifiedByUser: string[]): IFuture<void>
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

	reset(): IFuture<void>;
	apply(configName: string): IFuture<void>;
	printConfigData(): IFuture<void>;
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
	getAppScaffoldingConfig(): IFuture<IAppScaffoldingConfig>;
	getAllGenerators(): IFuture<IGeneratorConfig[]>;
	getGeneratorConfig(generatorName: string): IFuture<IGeneratorConfig>;
}

interface IServerConfiguration {
	tfisServer: IFuture<string>;
	assemblyVersion: IFuture<string>;
	resourcesPath: IFuture<string>;
}

interface IExtensionPlatformServices extends IRunValidator {
	packageName: string;
	executableName: string;
	runApplication(applicationPath: string, applicationParams: string[]): void;
}

interface IDebuggerService {
	debugAndroidApplication(applicationId: string): IFuture<void>;
	debugIosApplication(applicationId: string): void;
}

interface IRunValidator {
	canRunApplication(): IFuture<boolean>;
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
	generateDataUri(data: string): string;
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
	 * @return {IFuture<void>}
	 */
	downloadCordovaJsFiles(): IFuture<void>;
	/**
	 * Download a specific resource from the server
	 * @param  {string}        remotePath the path to the resource on the remote server
	 * @param  {string}        targetPath the path where the resource is written
	 * @return {IFuture<void>}
	 */
	downloadResourceFromServer(remotePath: string, targetPath: string): IFuture<void>;
	/**
	 * Download image definitions json file from the server
	 * @return {IFuture<void>}
	 */
	downloadImageDefinitions(): IFuture<void>;
}

interface IUserSettingsFileService {
	deleteUserSettingsFile(): IFuture<void>;
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
	prepareExtension(packageName: string, beforeDownloadPackageAction: () => void): IFuture<void>;
}

interface IAppScaffoldingExtensionsService {
	appScaffoldingPath: string;
	prepareAppScaffolding(afterPrepareAction?: () => void): IFuture<void>;
}

interface IScreenBuilderService {
	generatorFullName: string;
	commandsPrefix: string;
	screenBuilderSpecificFiles: string[];
	prepareAndGeneratePrompt(projectPath: string, generatorName?: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<boolean>;
	allSupportedCommands(projectPath: string, generatorName?: string): IFuture<string[]>;
	generateAllCommands(projectPath: string, generatorName?: string): IFuture<void>;
	composeScreenBuilderOptions(answers: string, bacisSceenBuilderOptions?: IScreenBuilderOptions): IFuture<IScreenBuilderOptions>;
	ensureScreenBuilderProject(projectPath: string): IFuture<void>;
	shouldUpgrade(projectPath: string): IFuture<boolean>;
	upgrade(projectPath: string): IFuture<void>;
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
	 * @return {IFuture<void>}
	 */
	downloadMigrationData(): IFuture<void>;

	/**
	 * Gives a list of all supported versions. Each version is a string in the following format <Major>.<Minor>.<Patch>
	 * @return {IFuture<string[]>} List of all supported versions.
	 */
	getSupportedVersions(): IFuture<string[]>;

	/**
	 * Gives a list of all supported framework versions. Each one is presented with version and user-friendly display name.
	 * @return {IFuture<IFrameworkVersion[]>} List of all supported frameworks, each one with version and display name.
	 */
	getSupportedFrameworks(): IFuture<IFrameworkVersion[]>;

	/**
	 * Gets the user-friendly name of the specified version.
	 * @param  {string} version The version of the framework.
	 * @return {IFuture<string>} User-friendly name of the specified version.
	 */
	getDisplayNameForVersion(version: string): IFuture<string>;
	/**
	 * Hook which is dynamically called when a project's framework version is changing
	 * @param  {string} newVersion The version to upgrade/downgrade to
	 * @return {IFuture<void>}
	 */
	onFrameworkVersionChanging(newVersion: string): IFuture<void>;
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
	pluginsForVersion(version: string): IFuture<string[]>;
	/**
	 * Migrate plugins from one Cordova version to another.
	 * @param {string} fromVersion The current Cordova Framework version.
	 * @param {string} toVersion The Cordova Framework version to be used.
	 * @return {string[]} Migrated plugins.
	 */
	migratePlugins(plugins: string[], fromVersion: string, toVersion: string): IFuture<string[]>;
	/**
	 * Hook which is dynamically called when a project's windows phone sdk version is changing
	 * @param  {string} newVersion The version to upgrade/downgrade to
	 * @return {IFuture<void>}
	 */
	onWPSdkVersionChanging?(newVersion: string): IFuture<void>;
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
	cloneSample(sampleName: string): IFuture<void>;
	printSamplesInformation(framework?: string): IFuture<void>;
}

interface IExpress {
	run(): void;
	listen(port: number, callback?: Function): any;
	post(route: string, callback: (req: any, res: any) => IFuture<void>): void;
}

interface IDomainNameSystem {
	getDomains(): IFuture<string[]>;
}

interface ICordovaPluginsService {
	getAvailablePlugins(): IFuture<Server.CordovaPluginData[]>;
	createPluginData(plugin: any): IPlugin[];
}

/**
 * Defines methods required to work with plugins.
 */
interface IPluginsService {
	/**
	 * Gets all available plugins for the current project type.
	 * NOTE: For NativeScript projects the count of listed NPM packages and NPM plugins is controlled
	 * via pluginsCount parameter.
	 * @param {number} pluginsCount - number of NPM packages and NativeScript NPM Plugins to be shown.
	 * The count is for each of the groups separately.
	 * @return {IPlugin[]} - Array of plugins found.
	 */
	getAvailablePlugins(pluginsCount?: number): IPlugin[];

	/**
	 * Provides information about all installed plugins.
	 * @return {IPlugin[]} Array of all installed plugins and information about each of them.
	 */
	getInstalledPlugins(): IPlugin[];

	/**
	 * Shows information about specified plugins.
	 * @param {IPlugin[]} plugins Array of plugins that will be printed.
	 * @return {void}
	 */
	printPlugins(plugins: IPlugin[]): void;

	/**
	 * Adds plugin to the current project, so it can be used in the application.
	 * @param {string} pluginName The name of the plugin that has to be added. It can contains the required version.
	 * For example these are valid names: "lodash", "lodash@3.10.1"
	 * @return {IFuture<void>}
	 */
	addPlugin(pluginName: string): IFuture<void>;

	/**
	 * Removes plugin from the current project.
	 * @param {string} pluginName The name of the plugin that has to be removed.
	 * @return {IFuture<void>}
	 */
	removePlugin(pluginName: string): IFuture<void>;

	/**
	 * Used to configure a plugin.
	 * @param  {string}        pluginName     The name of the plugin.
	 * @param  {string}        version        The version of the plugin.
	 * @param  {string[]}      configurations Configurations in which the plugin should be configured. Example: ['debug'], ['debug', 'release']
	 * @return {IFuture<void>}
	 */
	configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void>;

	/**
	 * Checks if the specified plugin is installed for the current project.
	 * @param {string} pluginName The name of the plugin which has to be checked. It can contain the required version.
	 * For example these are valid names: "lodash", "lodash@3.10.1"
	 * @return {boolean} 'true' in case the plugin with specified version is installed, false otherwise.
	 */
	isPluginInstalled(pluginName: string): boolean;
	/**
	 * Returns basic information about the plugin - it's name, version and cordova version range
	 * @param  {string}                  pluginName The name of the plugin
	 * @return {IFuture<IBasicPluginInformation>}            Basic information about the plugin
	 */
	getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation>;

	/**
	 * Copies the source code of a plugin inside the project and adds it as a reference, so it can be used within the application.
	 * @param {string} pluginIdentifier The identifier of the plugin that will be copied to the source code.
	 * @return {IFuture<void>}
	 */
	fetch(pluginIdentifiers: string): IFuture<void>;

	/**
	 * Search for plugins based on specified keywords and returns basic information about each of them.
	 * @param {string[]} keywords Array of keywords that will be used for searching.
	 * @return {IBasicPluginInformation[]} Array of information for all available plugins matching at least one of the specified keywords.
	 */
	findPlugins(keywords: string[]): IFuture<IBasicPluginInformation[]>;

	/**
	 * Filters plugin based on framework specific rules.
	 * @param {IPlugin[]} plugins Array of plugins to be filtered.
	 * @return {IPlugin[]} Plugins that pass the filter.
	 */
	filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]>;
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

interface IBasicPluginInformation {
	/**
	 * The plugin's name
	 * @type {string}
	 */
	name: string;
	/**
	 * The plugin's description
	 * @type {string}
	 */
	description?: string;
	/**
	 * The plugin's version in the form of Major.Minor.Patch
	 * @type {string}
	 */
	version: string;

	/**
	 * Variables used by the plugin.
	 * @type {any[]}
	 */
	variables?: any[];
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

interface ITypeScriptCompilerOptions {
	codePage: number; // Specify the codepage to use when opening source files.
	declaration: boolean; //  Generates corresponding .d.ts file.
	mapRoot: string; //  Specifies the location where debugger should locate map files instead of generated locations.
	module: string; // Specify module code generation: 'commonjs' or 'amd'.
	noImplicitAny: boolean; //  Warn on expressions and declarations with an implied 'any' type.
	out: string; // Concatenate and emit output to single file.
	outDir: string; // Redirect output structure to the directory.
	removeComments: boolean; // Do not emit comments to output.
	sourceMap: boolean; // Generates corresponding .map file
	sourceRoot: string; // Specifies the location where debugger should locate TypeScript files instead of source locations.
	targetVersion: string;  // Specify ECMAScript target version: 'ES3' (default), or 'ES5'.
}

interface IProcessInfo {
	isRunning(name: string): IFuture<boolean>;
}

interface IRemoteProjectService {
	getProjectProperties(solutionName: string, projectName: string): IFuture<any>;
	getProjectsForSolution(solutionId: string): IFuture<Server.IWorkspaceItemData[]>;
	getProjectName(solutionId: string, projectId: string): IFuture<string>;
	exportProject(remoteSolutionName: string, remoteProjectName: string): IFuture<void>;
	exportSolution(remoteSolutionName: string): IFuture<void>;
	getAvailableAppsAndSolutions(): IFuture<ITapAppData[]>;
	getSolutionData(propertyValue: string): IFuture<Server.SolutionData>;
}

interface IProjectSimulatorService {
	getSimulatorParams(simulatorPackageName: string): IFuture<string[]>;
}

interface ILiveSyncService {
	livesync(platform?: string): IFuture<void>;
}

interface IAppManagerService {
	upload(platform: string): IFuture<void>;
	openAppManagerStore(): void;
	publishLivePatch(platforms: string[]): IFuture<void>;
	getGroups(): IFuture<void>;
}

interface IDynamicSubCommandInfo {
	baseCommandName: string;
	filePath: string;
	commandConstructor: Function;
}

interface IKendoUIService {
	getKendoPackages(options: IKendoUIFilterOptions): IFuture<Server.IKendoDownloadablePackageData[]>;
}

interface IPublishService {
	publish(idOrUrl: string, username: string, password: string): IFuture<void>;
	listAllConnections(): void;
	addConnection(name: string, publishUrl: string): IFuture<void>;
	removeConnection(idOrName: string): IFuture<void>;
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
	getWebView(platform: string, webViewName: string): IWebView;
	getWebViews(platform: string): IWebView[];
	getWebViewNames(platform: string): string[];
	enableWebView(platform: string, webViewName: string): IFuture<void>;
	getCurrentWebViewName(platform: string): string;
}

/**
 * Describes WebView with name minSupportedVersion and pluginIdentifier.
 */
interface IWebView {
	name: string;
	minSupportedVersion: string;
	pluginIdentifier?: string;
	default?: boolean;
}

/**
 * Service for interaction with the simulator
 */
interface ISimulatorService {
	/**
	 * Used to start simulator
	 * @return {IFuture<void>}
	 */
	launchSimulator(): IFuture<void>;
}


/**
 * Used to manage images
 */
interface IImageService {
	/**
	 * Print image definitions
	 */
	printDefinitions(): IFuture<void>;
	/**
	 * Generate images and save them to the project
	 * @param  {string}           initialImagePath hi-res image from which to generate all the others
	 * @param  {Server.ImageType} imageType        Icon or Splashscreen
	 * @param  {boolean}          force            whether to overwrite conflicting images
	 * @return {IFuture<void>}
	 */
	generateImages(initialImagePath: string, imageType: Server.ImageType, force: boolean): IFuture<void>;
	/**
	 * Prompt the user for more information about image generation
	 * @param  {boolean}       force whether to overwrite conflicting images
	 * @return {IFuture<void>}
	 */
	promptForImageInformation(force: boolean): IFuture<void>;
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
	startApiServer(portNumber: number): IFuture<void>;
}

/**
 *	Used for managing cordova-related resources
 */
interface ICordovaResourceLoader {
	/**
	 * Builds the absolute path to a Cordova javascript file.
	 * @param  {string} version  The Cordova version
	 * @param  {string} platform The Platform - Android, iOS or WP8
	 * @return {string}          Absolute path to Cordova javascript file
	 */
	buildCordovaJsFilePath(version: string, platform: string): string;
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
	upload(userName: string, password: string, application: string): IFuture<void>;

	/**
	 * Query the server for applications ready to upload to itunes connect
	 * @param userName
	 * @param password
	 */
	getApplicationsReadyForUpload(userName: string, password: string): IFuture<Server.Application[]>;
}


/**
 *	Used for communicating with screenbuilder generators
 */
interface IScaffolder {
	scaffolder: any;
	future: IFuture<any>;
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
	transformToAppBuilderProject(createBackup: boolean): IFuture<void>
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
	copy(text: string): IFuture<string>;

	/**
	 * Returns the current contents of the system clipboard.
	 * @return {string} the current contents of the system clipboard.
	 */
	paste(): IFuture<string>;
}

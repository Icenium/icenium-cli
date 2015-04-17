
declare module Server {
	interface IRequestBodyElement {
		name: string;
		value: any;
		contentType: string;
	}

	interface IServiceProxy {
		call<T>(name: string, method: string, path: string, accept: string, body: IRequestBodyElement[], resultStream: NodeJS.WritableStream, headers?: any): IFuture<T>;
		setShouldAuthenticate(shouldAuthenticate: boolean): void;
		setSolutionSpaceName(solutionSpaceName: string): void;
	}

	interface IServiceContractClientCode {
		interfaceFile: string;
		implementationFile: string;
	}

	interface IServiceContractGenerator {
		generate(): IFuture<Server.IServiceContractClientCode>;
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
		NeedPurchase: boolean;
		VersionTags: string[];
	}
}

interface IUserDataStore {
	hasCookie(): IFuture<boolean>;
	getCookies(): IFuture<IStringDictionary>;
	getUser(): IFuture<any>;
	setCookies(cookies?: IStringDictionary): IFuture<void>;
	parseAndSetCookies(setCookieHeader: any, cookies?: IStringDictionary): IFuture<void>;
	setUser(user?: any): IFuture<void>;
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
		executeBuild(platform: string): IFuture<void>;
		build(settings: IBuildSettings): IFuture<Server.IPackageDef[]>;
		deploy(platform: string, device?: Mobile.IDevice): IFuture<Server.IPackageDef[]>;
	}

	interface IBuildSettings {
		platform: string;
		configuration?: string;
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

interface IProjectCapabilities {
	build: boolean;
	buildCompanion: boolean;
	deploy: boolean
	simulate: boolean;
	livesync: boolean;
	livesyncCompanion: boolean;
	updateKendo: boolean;
	emulate: boolean;
	publish: boolean;
	uploadToAppstore: boolean;
}

interface IProjectData extends IDictionary<any> {
	ProjectName: string;
	ProjectGuid: string;
	projectVersion : number;
	AppIdentifier: string;
	DisplayName: string;
	Author: string;
	Description: string;
	BundleVersion: string;
	Framework: string;
	FrameworkVersion: string;
	CorePlugins: string[];
	AndroidPermissions: string[];
	DeviceOrientations: string[];
	AndroidHardwareAcceleration: string;
	AndroidVersionCode: string;
	iOSStatusBarStyle: string;
	iOSDeviceFamily: string[];
	iOSBackgroundMode: string[];
	WP8ProductID: string;
	WP8PublisherID: string;
	WP8Publisher: string;
	WP8TileTitle: string;
	WP8Capabilities: string[];
	WP8Requirements: string[];
	WP8SupportedResolutions: string[];
	WPSdk?: string;
	WP8PackageIdentityName?: string;
	WP8WindowsPublisherName?: string;
	CordovaPluginVariables?: any;
}

interface IProjectPropertiesService {
	getProjectProperties(projectFile: string, isJsonProjectFile: boolean, frameworkProject: Project.IFrameworkProject): IFuture<IProjectData>;
	completeProjectProperties(properties: any, frameworkProject: Project.IFrameworkProject): boolean;
	updateProjectProperty(projectData: any, mode: string, property: string, newValue: any): IFuture<void>;
	normalizePropertyName(property: string, projectData: IProjectData): string;
	getValidValuesForProperty(propData: any): IFuture<string[]>;
	getPropertiesForAllSupportedProjects(): IFuture<string>;
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
	DEFAULT_WEBSITE_PROJECT_TEMPLATE: string;
	CORDOVA_PLUGINS_REGISTRY: string;
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;
	AUTO_UPGRADE_PROJECT_FILE: boolean;
	TYPESCRIPT_COMPILER_OPTIONS: ITypeScriptCompilerOptions;

	reset(): IFuture<void>;
	apply(configName: string): IFuture<void>;
	printConfigData(): IFuture<void>;
}

interface IStaticConfig extends Config.IStaticConfig {
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
}

interface IExtensionPlatformServices {
	getPackageName() : string;
	executableName: string;
	runApplication(applicationPath: string, applicationParams: string[]): void;
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

interface IResourceLoader {
	appResourcesDir: string;
	resolvePath(path: string): string;
	openFile(path: string): any;
	readJson(path: string): IFuture<any>;
	buildCordovaJsFilePath(version: string, platform: string): string;
}

interface IResourceDownloader {
	downloadCordovaJsFiles(): IFuture<void>;
}

interface IUserSettingsFileService {
	deleteUserSettingsFile(): IFuture<void>;
	userSettingsFilePath: string;
}

interface IUserSettingsService extends UserSettings.IUserSettingsService {
	loadUserSettingsFile(): IFuture<void>;
	saveSettings(data: IDictionary<{}>): IFuture<void>;
}

interface IDependencyConfig {
	name: string;
	version: string;
	gitHubRepoUrl: string;
	downloadUrl?: string;
	pathToSave?: string;
}

interface IAppScaffoldingConfig extends IDependencyConfig { }

interface IGeneratorConfig extends IDependencyConfig { }

interface IExtensionsServiceBase {
	getExtensionVersion(packageName: string): string;
	getExtensionPath(packageName: string): string;
	cacheDir: string;
}

interface IServerExtensionsService extends IExtensionsServiceBase {
	prepareExtension(packageName: string, beforeDownloadPackageAction: () => void): IFuture<void>;
}

interface IDependencyExtensionsServiceBase extends IExtensionsServiceBase {
	prepareDependencyExtension(dependencyExtensionName: string, dependencyConfig: IDependencyConfig, afterPrepareAction: () => IFuture<void>): IFuture<void>;
}

interface IGeneratorExtensionsService {
	prepareGenerator(generatorName: string): IFuture<void>;
}

interface IAppScaffoldingExtensionsService {
	appScaffoldingPath: string;
	prepareAppScaffolding(afterPrepareAction?: () => void): IFuture<void>;
}

interface IScreenBuilderService {
	generatorName: string;
	commandsPrefix: string;
	prepareAndGeneratePrompt(generatorName: string, screenBuilderOptions?: IScreenBuilderOptions): IFuture<void>;
	allSupportedCommands(generatorName?: string): IFuture<string[]>;
	generateAllCommands(generatorName: string): IFuture<void>;
	installAppDependencies(): IFuture<void>;
}

interface IScreenBuilderOptions {
	type?: string;
	answers?: IScreenBuilderAnswer;
	projectPath?: string;
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

interface IPathFilteringService {
	getRulesFromFile(file: string) : string[];
	filterIgnoredFiles(files: string[], rules: string[], rootDir: string) :string[];
	isFileExcluded(file: string, rules: string[], rootDir: string): boolean
}

interface ICordovaMigrationService {
	downloadCordovaMigrationData(): IFuture<void>;
	getSupportedVersions(): IFuture<string[]>;
	pluginsForVersion(version: string): IFuture<string[]>;
	migratePlugins(plugins: string[], fromVersion: string, toVersion: string): IFuture<string[]>;
	getSupportedFrameworks(): IFuture<Server.FrameworkVersion[]>;
	getDisplayNameForVersion(version: string): IFuture<string>;
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

interface IPluginsService {
	getAvailablePlugins(): IPlugin[];
	getInstalledPlugins(): IPlugin[];
	getInstalledPluginsEnabledAtLeastInOneConfiguration(): IPlugin[];
	printPlugins(plugins: IPlugin[]): void;
	addPlugin(pluginName: string): IFuture<void>;
	removePlugin(pluginName: string): IFuture<void>;
	configurePlugin(pluginName: string, configuration?: string): IFuture<void>;
	isPluginInstalled(pluginName: string): boolean;
}

interface IPlugin {
	data: Server.CordovaPluginData;
	type: any;
	configurations: string[];
	pluginInformation: string[];
	toProjectDataRecord(version?: string): string;
}

interface IBasicPluginInformation {
	name: string;
	description: string;
	version: string;
}

interface IMarketplacePlugin extends IPlugin {
	pluginVersionsData: Server.MarketplacePluginVersionsData;
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
	makeTapServiceCall<T>(call: () => IFuture<T>): IFuture<T>;
	getProjectProperties(projectName: string): IFuture<any>;
	getProjects(): IFuture<Server.TapSolutionData[]>;
	getProjectName(projectId: string): IFuture<string>;
}

interface IProjectSimulatorService {
	getSimulatorParams(simulatorPackageName: string): IFuture<string[]>;
}

interface IDeployHelper {
	deploy(platform?: string): IFuture<void>;
}

interface ILiveSyncService {
	livesync(platform?: string): IFuture<void>;
}

interface IAppManagerService {
	upload(platform: string): IFuture<void>;
	openAppManagerStore(): void;
	publishLivePatch(platforms: string[]): IFuture<void>;
}

interface IProgressIndicator {
	showProgressIndicator(future: IFuture<any>, timeout: number): IFuture<void>;
}

interface IDynamicSubCommandInfo {
	baseCommandName: string;
	filePath: string;
	commandConstructor: Function;
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

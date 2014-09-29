
declare module Server {
	interface IRequestBodyElement {
		name: string;
		value: any;
		contentType: string;
	}

	interface IServiceProxy {
		call<T>(name: string, method: string, path: string, accept: string, body: IRequestBodyElement[], resultStream: WritableStream): IFuture<T>;
		setShouldAuthenticate(shouldAuthenticate: boolean): void;
		setSolutionSpaceName(solutionSpaceName: string): void;
	}

	interface IServiceContractClientCode {
		interfaceFile: string;
		implementationFile: string;
	}

	interface IServiceContractGenerator {
		generate(): IServiceContractClientCode;
	}

	interface IServiceContractProvider {
		getApi(): Server.Contract.IService[];
	}

	interface IIdentityManager {
		listCertificates(): IFuture<void>;
		listProvisions(): IFuture<void>;
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
	}
}

interface IUserDataStore {
	hasCookie(): IFuture<boolean>;
	getCookies(): IFuture<IStringDictionary>;
	getUser(): IFuture<any>;
	setCookies(cookies?: IStringDictionary): IFuture<void>;
	setUser(user?: any): IFuture<void>;
	clearLoginData(): IFuture<void>;
}

interface ILoginManager {
	login(): IFuture<void>;
	logout(): IFuture<void>;
	isLoggedIn(): IFuture<boolean>;
	ensureLoggedIn(): IFuture<void>;
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

	interface IBuildService {
		getLiveSyncUrl(urlKind: string, filesystemPath: string, liveSyncToken: string): IFuture<string>;
		buildProject(solutionName: string, projectName: string, solutionSpace: string, buildProperties: any): IFuture<Server.IBuildResult>;
		importProject(): IFuture<void>;
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
	}

	interface IProject {
		PROJECT_FILE: string;
		projectData: IProjectData;
		projectType: number;
		capabilities: IProjectCapabilities;
		projectTargets: IFuture<string[]>;
		getProjectDir(): IFuture<string>;
		ensureProject(): void;
		enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]>;
		isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean;
		updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void>;
		printProjectProperty(property: string): IFuture<void>;
		createNewProject(projectType: number, projectName: string): IFuture<void>;
		createProjectFileFromExistingProject(projectType: number): IFuture<void>;
		createProjectFile(projectDir: string, projectType: number, properties: any): IFuture<void>;
		createTemplateFolder(projectDir: string): IFuture<any>;
		getTempDir(extraSubdir?:string): IFuture<string>;
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
}

interface IOpener {
	open(filename: string): void;
}

interface IProjectData {
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
}

interface IProjectPropertiesService {
	getProjectProperties(projectFile: string, isJsonProjectFile: boolean): IFuture<IProjectData>;
	completeProjectProperties(properties: any): boolean;
	updateProjectProperty(projectData: any, mode: string, property: string, newValue: any, propSchema: any, useMapping?: boolean) : IFuture<void>;
	normalizePropertyName(property: string, schema: any): string;
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
	TYPESCRIPT_COMPILER_OPTIONS: ITypescriptCompilerOptions;

	reset(): IFuture<void>;
	apply(configName: string): IFuture<void>;
}

interface IStaticConfig extends Config.IStaticConfig {
	QR_SIZE: number;
	SOLUTION_SPACE_NAME: string;
}

interface IServerConfiguration {
	tfisServer: IFuture<string>;
	assemblyVersion: IFuture<string>;
}

interface IExtensionPlatformServices {
	getPackageName() : string;
	runApplication(applicationPath: string, applicationParams: string[]): void;
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

interface IServerExtensionsService {
	prepareExtension(packageName: string): IFuture<void>;
	getExtensionVersion(packageName: string): string;
	getExtensionPath(packageName: string): string;
	cacheDir: string;
}

interface IPathFilteringService {
	getRulesFromFile(file: string) : string[];
	filterIgnoredFiles(files: string[], rules: string[], rootDir: string) :string[];
}

interface ICordovaMigrationService {
	downloadCordovaMigrationData(): IFuture<void>;
	getSupportedVersions(): IFuture<string[]>;
	pluginsForVersion(version: string): IFuture<string[]>;
	migratePlugins(plugins: string[], fromVersion: string, toVersion: string): IFuture<string[]>;
}

interface ISamplesService {
	cloneSample(sampleName: string): IFuture<void>;
	printSamplesInformation(): IFuture<string>;
}

interface IExpress {
    run(): void;
    listen(port: number, callback?: Function): any;
    post(route: string, callback: (req: any, res: any) => IFuture<void>): void;
}

interface ITypescriptCompilerOptions {
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


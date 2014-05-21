interface IDisposable {
	dispose(): void;
}

declare module Server {
	interface IResponse {
		response: any;
		body?: string;
		headers: any;
		error?: Error;
	}

	interface IRequestBodyElement {
		name: string;
		value: any;
		contentType: string;
	}

	interface IServiceProxy {
		call<T>(name: string, method: string, path: string, accept: string, body: IRequestBodyElement[], resultStream: WritableStream): IFuture<T>;
		getLastRequestCookies(): any;
		setShouldAuthenticate(shouldAuthenticate: boolean): void;
		setSolutionSpaceName(solutionSpaceName: string): void;
	}

	interface IHttpClient {
		httpRequest(url:string): IFuture<IResponse>;
		httpRequest(options:any): IFuture<IResponse>;
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
		listCertificates(): IFuture<any>;
		listProvisions(): IFuture<any>;
		findCertificate(identityStr): IFuture<ICryptographicIdentity>;
		findProvision(provisionStr): IFuture<IProvision>;
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
	}
}

interface IUserDataStore {
	hasCookie(): IFuture<boolean>;
	getCookie(): IFuture<string>;
	getUser(): IFuture<any>;
	setCookie(cookie: string): IFuture<void>;
	setUser(user: any): IFuture<void>;
	clearLoginData(): IFuture<void>;
}

interface ILoginManager {
	basicLogin(userName: string, password: string): IFuture<void>;
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
		buildProject(solutionName, projectName, solutionSpace, buildProperties): IFuture<Server.IBuildResult>;
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
	}

	interface IProject {
		PROJECT_FILE: string;
		projectData: IProjectData;
		projectType: number;
		getProjectDir(): string;
		ensureProject(): void;
		enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]>;
		isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean;
		updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void>;
		printProjectProperty(property: string): IFuture<void>;
		createNewCordovaProject(projectName: string): IFuture<void>;
		createNewNativeScriptProject(projectName: string): IFuture<void>;
		createCordovaProjectFileFromExistingProject(): IFuture<void>;
		createNativeScriptProjectFileFromExistingProject(): IFuture<void>;
		createProjectFile(projectDir: string, projectName: string, projectType: number, properties: any): IFuture<void>;
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

// duplicated from fs.Stats, because I cannot import it here
interface IFsStats {
	isFile(): boolean;
	isDirectory(): boolean;
	isBlockDevice(): boolean;
	isCharacterDevice(): boolean;
	isSymbolicLink(): boolean;
	isFIFO(): boolean;
	isSocket(): boolean;
	dev: number;
	ino: number;
	mode: number;
	nlink: number;
	uid: number;
	gid: number;
	rdev: number;
	size: number;
	blksize: number;
	blocks: number;
	atime: Date;
	mtime: Date;
	ctime: Date;
}

interface IFileSystem {
	zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): IFuture<void>;
	unzip(zipFile: string, destinationDir: string): IFuture<void>;
	exists(path: string): IFuture<boolean>;
	deleteFile(path: string): IFuture<void>;
	deleteDirectory(directory: string): IFuture<void>;
	getFileSize(path: string): IFuture<number>;
	futureFromEvent(eventEmitter: any, event: string): IFuture<any>;
	createDirectory(path: string): IFuture<void>;
	readDirectory(path: string): IFuture<string[]>;
	readFile(filename: string): IFuture<NodeBuffer>;
	readText(filename: string, encoding?: string): IFuture<string>;
	readJson(filename: string, encoding?: string): IFuture<any>;
	writeFile(filename: string, data: any, encoding?: string): IFuture<void>;
	writeJson(filename: string, data: any, space?: string, encoding?: string): IFuture<void>;
	copyFile(sourceFileName: string, destinationFileName: string): IFuture<void>;
	getUniqueFileName(baseName: string): IFuture<string>;
	getFsStats(path: string): IFuture<IFsStats>;

	createReadStream(path: string, options?: {
		flags?: string;
		encoding?: string;
		fd?: string;
		mode?: number;
		bufferSize?: number;
	}): any;
	createWriteStream(path: string, options?: {
		flags?: string;
		encoding?: string;
		string?: string;
	}): any;

	chmod(path: string, mode: number): IFuture<any>;
}

interface IOpener {
	open(filename: string): void;
}

interface IChildProcess {
	exec(command: string): IFuture<any>;
	spawn(command: string, args?: string[], options?: any): any;
}

interface IProjectData {
	ProjectName: string;
	projectVersion : number;
	projectType: string;
	AppIdentifier: string;
	DisplayName: string;
	Author: string;
	Description: string;
	BundleVersion: string;
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

interface IConfiguration {
	AB_SERVER_PROTO: string;
	AB_SERVER: string;
	DEBUG: boolean;
	PROXY_TO_FIDDLER: boolean;
	PROJECT_FILE_NAME: string;
	SOLUTION_SPACE_NAME: string;
	QR_SIZE: number;
	DEFAULT_CORDOVA_PROJECT_TEMPLATE: string;
	DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE: string;
	CORDOVA_PLUGINS_REGISTRY: string;
	DEFAULT_PROJECT_NAME: string;
	CI_LOGGER: boolean;
	WRAP_CLIENT_ID: string;
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;
	AUTO_UPGRADE_PROJECT_FILE: boolean;
	ANALYTICS_API_KEY: string;

	reset(): IFuture<void>;
	apply(configName: string): IFuture<void>;
	version: string;
}

interface IServerConfiguration {
	tfisServer: IFuture<string>;
	assemblyVersion: IFuture<string>;
}

interface IErrors {
	fail(formatStr: string, ...args: any[]): void;
	fail(opts: {formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean}, ...args: any[]): void;

	beginCommand(action: () => any, printCommandHelp: () => void): any;
	verifyHeap(message: string): void;
}

declare enum ErrorCodes {
	UNKNOWN = 127
}

interface IPrompter extends IDisposable {
	start(): void;
	get(schema: IPromptSchema): IFuture<any>;
	getPassword(prompt: string, options?: {allowEmpty?: boolean}): IFuture<string>;
	confirm(prompt: string, defaultAction?: () => string): IFuture<boolean>;
	history(name: string): IPromptHistoryValue;
	override(object: any): void;
}

interface IExtensionPlatformServices {
	getPackageName() : string;
	runApplication(applicationPath: string, applicationParams: string[]);
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
	downloadProjectFileSchema(): IFuture<void>;
}

interface IQueue<T> {
	enqueue(item: T): void;
	dequeue(): IFuture<T>;
}

interface IFutureDispatcher {
	run(): void;
	dispatch(action: () => IFuture<void>): void;
}

interface IAnalyticsService {
	checkConsent(featureName: string): IFuture<void>;
	trackFeature(featureName: string): IFuture<void>;
	trackException(exception: any, message: string): IFuture<void>;
}

interface IUserSettingsFileService {
	deleteUserSettingsFile(): IFuture<void>;
	userSettingsFilePath: string;
}

interface IUserSettingsService {
	loadUserSettingsFile(): IFuture<void>;
	saveSettings(data: {[key: string]: {}}): IFuture<void>;
	getValue(propertyName: string): IFuture<any>;
}

interface ICommandOptions {
	disableAnalytics?: boolean;
}

interface ICancellationService extends IDisposable {
	begin(name: string): IFuture<void>;
	end(name: string): void;
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


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
		findCertificate(identityStr): IFuture<any>;
		findProvision(provisionStr): IFuture<any>;
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
	}

	interface IProject {
		projectData: any;
		getProjectDir(): string;
		ensureProject(): void;
		enumerateProjectFiles(additionalExcludedProjectDirsAndFiles?: string[]): string[];
		isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean;
		deploy(platform: string): IFuture<Server.IPackageDef[]>;
		executeBuild(platform: string): IFuture<void>;
		build(platform: string, configuration: string, showQrCodes: boolean, downloadFiles: boolean): IFuture<Server.IPackageDef[]>;
		importProject(): IFuture<void>;
		updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void>;
		printProjectProperty(property: string): void;
		createNewProject(projectName: string): IFuture<void>;
		createProjectFile(projectDir: string, projectName: string, properties: any): IFuture<any>;
	}
}

interface IFileSystem {
	zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): IFuture<void>;
	exists(path: string): IFuture<boolean>;
	deleteFile(path: string): IFuture<void>;
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
	name: string;
	projectVersion : number;
	AppIdentifier: string;
	DisplayName: string;
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
	DEFAULT_PROJECT_TEMPLATE: string;
	TEMPLATE_NAMES: string[];
	CORDOVA_PLUGINS_REGISTRY: string;
	DEFAULT_PROJECT_NAME: string;
	CI_LOGGER: boolean;
	WRAP_CLIENT_ID: string;
	USE_CDN_FOR_SIMULATOR_DOWNLOAD: boolean;

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

interface IPrompter {
	start(): void;
	get(schema: IPromptSchema): IFuture<any>;
	getPassword(prompt: string, options?: {allowEmpty?: boolean}): IFuture<string>;
	confirm(prompt: string): IFuture<boolean>;
	history(name: string): IPromptHistoryValue;
	override(object: any): void;
}

interface ISimulatorPlatformServices {
	getPackageName() : string;
	preparePackage(simulatorPath: string): void;
	runSimulator(simulatorPath: string, simulatorParams: string[]);
}

interface IX509Certificate {
	issuerData: any;
	expiresOn: Date;
}

interface IX509CertificateLoader {
	load(certificatePem: string): IX509Certificate;
}

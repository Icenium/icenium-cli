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
		listCertificates(): void;
		listProvisions(): void;
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
	getCookie(): IFuture<string>;
	getUser(): IFuture<any>;
	setCookie(cookie: string): IFuture<void>;
	setUser(user: any): IFuture<void>;
}

interface ILoginManager {
	basicLogin(userName: string, password: string): IFuture<void>;
	login(): IFuture<void>;
	logout(): IFuture<void>;
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
		enumerateProjectFiles(excludedProjectDirsAndFiles?: string[]): string[];
		isProjectFileExcluded(projectDir: string, filePath: string, excludedDirsAndFiles: string[]): boolean;
		executeBuild(platform: string): IFuture<void>;
		importProject(): IFuture<void>;
		deployToIon(): IFuture<void>;
		updateProjectPropertyAndSave(mode: string, propertyName: string, propertyValues: string[]): IFuture<void>;
		printProjectProperty(property: string): void;
		createNewProject(projectName: string): IFuture<void>;
		createProjectFile(projectDir: string, projectName: string, properties: any): IFuture<any>;
		deployToDevice(platform: string): IFuture<void>;
	}
}

interface IFileSystem {
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
}

interface IChildProcess {
	exec(command: string): IFuture<any>;
	spawn(command: string, args?: string[], options?: string[]): any;
}
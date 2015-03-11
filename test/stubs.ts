///<reference path=".d.ts"/>
"use strict";

import Future = require("fibers/future");
import util = require("util");
import path = require("path");

export class LoggerStub implements ILogger {
	constructor() {
		// uncomment when debugging unit tests to print to the console
		//this.setLevel("DEBUG");
	}

	setLevel(level: string): void {}
	fatal(formatStr: string, ...args:string[]): void {}
	error(formatStr: string, ...args:string[]): void {}
	warn(formatStr: string, ...args:string[]): void {}
	info(formatStr: string, ...args:string[]): void {}
	debug(formatStr: string, ...args:string[]): void {}
	trace(formatStr: string, ...args:string[]): void {
		// uncomment when debugging unit tests to print to the console
		//args.unshift(formatStr);
		//console.log(util.format.apply(null, args));
	}

	public output = "";

	out(formatStr: string, ...args:string[]): void {
		args.unshift(formatStr);
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args:string[]): void { }

	prepare(item: any): string { return item; }

	printInfoMessageOnSameLine(message: string): void { }
	printMsgWithTimeout(message: string, timeout: number): IFuture<void> {
		return null;
	}
}

export class FileSystemStub implements IFileSystem {
	zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): IFuture<void> {
		return undefined;
	}
	
	unzip(zipFile: string, destination: string): IFuture<void> {
		return undefined;
	}
	exists(path: string): IFuture<boolean> {
		return Future.fromResult(true);
	}

	deleteFile(path:string):IFuture<void> {
		return undefined;
	}

	deleteDirectory(directory: string): IFuture<any> {
		return undefined;
	}

	getFileSize(path:string):IFuture<number> {
		return undefined;
	}

	futureFromEvent(eventEmitter: NodeJS.EventEmitter, event:string):IFuture<any> {
		return undefined;
	}

	createDirectory(path:string):IFuture<void> {
		return undefined;
	}

	readDirectory(path:string):IFuture<string[]> {
		return Future.fromResult([]);
	}

	readFile(filename:string):IFuture<NodeBuffer> {
		return undefined;
	}

	readText(filename:string, encoding?:string):IFuture<string> {
		return undefined;
	}

	readJson(filename:string, encoding?:string):IFuture<any> {
		return Future.fromResult({});
	}

	writeFile(filename:string, data: any, encoding?:string):IFuture<void> {
		return undefined;
	}

	writeJson(filename:string, data:any, space?:string, encoding?:string):IFuture<void> {
		return undefined;
	}

	copyFile(sourceFileName:string, destinationFileName:string):IFuture<void> {
		return undefined;
	}

	openFile(filename: string): void { }

	createReadStream(path:string, options?:{flags?: string; encoding?: string; fd?: string; mode?: number; bufferSize?: number}): any {
		return undefined;
	}

	createWriteStream(path:string, options?:{flags?: string; encoding?: string; string?: string}): any {
		return undefined;
	}

	chmod(path: string, mode: any): IFuture<any> {
		return undefined;
	}

	getUniqueFileName(baseName: string): IFuture<string> {
		return undefined;
	}

	getFsStats(path: string): IFuture<IFsStats> {
		return undefined;
	}

	isEmptyDir(directoryPath: string): IFuture<boolean> {
		return undefined;
	}

	isRelativePath(path: string): boolean {
		return false;
	}

	ensureDirectoryExists(directoryPath: string): IFuture<void> {
		return undefined;
	}

	rename(oldPath: string, newPath: string): IFuture<void> {
		return undefined;
	}

	symlink(sourePath: string, destinationPath: string): IFuture<void> {
		return undefined;
	}

	closeStream(stream: any): IFuture<void> {
		return undefined;
	}

	setCurrentUserAsOwner(path: string, owner: string): IFuture<void> {
		return undefined;
	}
	enumerateFilesInDirectorySync(directoryPath: string, filterCallback?: (file: string, stat: IFsStats) => boolean): string[] {
		return [];
	}
}

export class ErrorsStub implements IErrors {
	private impl: IErrors = new (require("../lib/common/errors").Errors)();

	printCallStack: boolean = false;

	fail(formatStr:string, ...args: any[]): void;
	fail(opts:{formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean}, ...args: any[]): void;

	fail(...args: any[]) {
		this.impl.fail.apply(this.impl, args);
	}

	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error();
	}

	beginCommand(action:() => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return action();
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }

	validateArgs(client: string, knownOpts: any, shorthands: any): any { return null; }
	validateYargsArguments(parsed: any, knownOpts: any, shorthands: any, clientName?: string): void { }
}

export class ErrorsNoFailStub implements IErrors {

	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) { throw new Error(); }
	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error();
	}

	beginCommand(action: () => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return (() => {
			try {
				var result = action().wait();
			} catch(ex) {
				return false;
			}

			return result;
		}).future<boolean>()();
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }

	validateArgs(client: string, knownOpts: any, shorthands: any): any { return null; }
	validateYargsArguments(parsed: any, knownOpts: any, shorthands: any, clientName?: string): void { }
}

export class OpenerStub implements IOpener {
	open(filename: string): void {}
}

export class LoginManager implements ILoginManager {
	basicLogin(userName: string, password: string): IFuture<void> {
		return undefined;
	}

	login(): IFuture<void> {
		return undefined;
	}

	logout(): IFuture<void> {
		return undefined;
	}

	isLoggedIn(): IFuture<boolean> {
		return Future.fromResult(false);
	}

	ensureLoggedIn(): IFuture<void> {
		return undefined;
	}

	telerikLogin(user: string, password: string): IFuture<void> {
		return undefined;
	}
}

export class TemplateServiceStub implements ITemplatesService {
	appResourcesDir:string;

	buildCordovaJsFilePath(version:string, platform:string):string {
		return undefined;
	}

	unpackAppResources():IFuture<void> {
		return undefined;
	}

	downloadCordovaJsFiles():IFuture<void> {
		return undefined;
	}

	get projectTemplatesDir(): string {
		return path.join(__dirname, "../resources/ProjectTemplates");
	}

	get itemTemplatesDir(): string {
		return path.join(__dirname, "../resources/ItemTemplates");
	}

	getTemplatesString(regexp: RegExp): IFuture<string> {
		return undefined;
	}

	downloadProjectTemplates(): IFuture<void> {
		return undefined;
	}

	downloadItemTemplates(): IFuture<void> {
		return undefined;
	}
}

export class PathFilteringServiceStub implements IPathFilteringService {
	getRulesFromFile(file: string) : string[] {
		return [];
	}
	filterIgnoredFiles(files: string[], rules: string[]) : string[] {
		return files;
	}

	isFileExcluded(file: string, rules: string[], rootDir: string): boolean {
		return false;
	}
}

export class FrameworkProjectResolver implements Project.IFrameworkProjectResolver {
	resolve(framework: string): Project.IFrameworkProject {
		return new FrameworkProjectStub(framework);
	}
}

class FrameworkProjectStub implements Project.IFrameworkProject {
	constructor(private framework: string) { }

	public get name(): string {
		return this.framework;
	}

	public get capabilities(): IProjectCapabilities { return undefined; }

	public get defaultProjectTemplate(): string { return undefined; }

	public get liveSyncUrl(): string { return undefined; }

	public get requiredAndroidApiLevel(): number { return 0; }

	public get configFiles(): Project.IConfigurationFile[]{ return undefined; }

	public get startPackageActivity(): string { return ""; }

	public getValidationSchemaId(): string { return ""; }

	public getTemplateFilename(name: string): string {
		return util.format("Telerik.Mobile.%s.%s.zip", this.framework, name);
	}

	public projectTemplatesString(): IFuture<string> { return undefined; }

	public alterPropertiesForNewProject(properties: any, projectName: string): void { }

	public getProjectFileSchema(): IDictionary<any> { return undefined; }

	public getFullProjectFileSchema(): IFuture<any> { return undefined; }

	public getProjectTargets(projectDir: string): IFuture<string[]> { return undefined; }

	public adjustBuildProperties(buildProperties: any, projectInformation?: Project.IProjectInformation): any { return undefined; }

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void> { return undefined; }

	public getSimulatorParams(projectDir: string, projectData: IProjectData, simulatorPackageName: string): IFuture<string[]> { return undefined; }

	public completeProjectProperties(properties: any): boolean { return false; }
}

export class ProjectFilesManager implements Project.IProjectFilesManager {
	public get availableConfigFiles(): IDictionary<Project.IConfigurationFile> {
		return undefined;
	}

	public enumerateProjectFiles(projectDir: string, additionalExcludedProjectDirsAndFiles?: string[]): IFuture<string[]> {
		return undefined;
	}

	public isProjectFileExcluded(projectDir: string, filePath: string, additionalExcludedDirsAndFiles?: string[]): boolean {
		return undefined;
	}
}

export class StaticConfig implements IStaticConfig {
	public PROJECT_FILE_NAME = ".abproject";
	public CLIENT_NAME = "appbuilder";
	public ANALYTICS_API_KEY = "13eaa7db90224aa1861937fc71863ab8";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "AnalyticsSettings.TrackFeatureUsage";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";

	public START_PACKAGE_ACTIVITY_NAME = ".TelerikCallbackActivity";

	public SOLUTION_SPACE_NAME = "Private_Build_Folder";
	public QR_SIZE = 300;
	public version = "1";
	helpTextPath = "help";
	adbFilePath = "adbFilePath";
	sevenZipFilePath = "7za";
	triggerJsonSchemaValidation = true;
}

export class HooksService implements IHooksService {
	initialize(commandName: string): void {
	}
	executeBeforeHooks(): IFuture<void> {
		return (() => { }).future<void>()();
	}
	executeAfterHooks(): IFuture<void> {
		return (() => { }).future<void>()();
	}
}

export class JsonSchemaValidator implements IJsonSchemaValidator {
	getValidProperties(framework: string, frameworkVersion: string): IStringDictionary {
		return null;
	}

	validate(data: IProjectData): void { }

	isValid(data: IProjectData): boolean {
		return true;
	}

	tryResolveValidationSchema(framework: string): IDictionary<any> {
		return null;
	}

	getPropertyType(framework: string, propertyName: string): string {
		return "";
	}
}

export class PrompterStub implements IPrompter {
	public confirmResult = false;

	start(): void {}
	get(schema: IPromptSchema): IFuture<any> { return Future.fromResult("");}
	getPassword(prompt: string, options?: {allowEmpty?: boolean}): IFuture<string> { return Future.fromResult("");}
	confirm(prompt: string, defaultAction?: () => string): IFuture<boolean> {
		return Future.fromResult(this.confirmResult);
	}
	history(name: string): IPromptHistoryValue { return undefined; }
	override(object: any): void {}
	public dispose() {}
}

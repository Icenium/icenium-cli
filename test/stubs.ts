///<reference path=".d.ts"/>

import Future = require("fibers/future");
import util = require("util");
import path = require("path");

export class LoggerStub implements ILogger {
	setLevel(level: string): void {}
	fatal(formatStr: string, ...args:string[]): void {}
	error(formatStr: string, ...args:string[]): void {}
	warn(formatStr: string, ...args:string[]): void {}
	info(formatStr: string, ...args:string[]): void {}
	debug(formatStr: string, ...args:string[]): void {}
	trace(formatStr: string, ...args:string[]): void {}

	public output = "";

	out(formatStr: string, ...args:string[]): void {
		args.unshift(formatStr);
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args:string[]): void { }
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

	futureFromEvent(eventEmitter: EventEmitter, event:string):IFuture<any> {
		return undefined;
	}

	createDirectory(path:string):IFuture<void> {
		return undefined;
	}

	readDirectory(path:string):IFuture<string[]> {
		return undefined;
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
}

export class ErrorsStub implements IErrors {
	private impl: IErrors = new (require("../lib/common/errors").Errors)();

	fail(formatStr:string, ...args: any[]): void;
	fail(opts:{formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean}, ...args: any[]): void;

	fail(...args: any[]) {
		this.impl.fail.apply(this.impl, args);
	}

	beginCommand(action:() => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return action();
	}

	verifyHeap(message: string): void {

	}
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

	get configurationFiles(): IConfigurationFile[] {
		return [{ template: "android-manifest", filepath: "App_Resources/Android/AndroidManifest.xml", templateFilepath: "Mobile.Android.ManifestXml.zip", helpText: "" }];
	}

	getTemplateFilename(projectType: number, name: string): string {
		var projectTypes = require("../lib/project-types");
		return util.format("Telerik.Mobile.%s.%s.zip", projectTypes[projectType], name);
	}

	projectCordovaTemplatesString(): string {
		return "";
	}
	projectNativeScriptTemplatesString(): string {
		return "";
	}

	get projectTemplatesDir(): string {
		return path.join(__dirname, "/resources/");
	}

	get itemTemplatesDir(): string {
		return path.join(__dirname, "/resources/");
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
}

export class StaticConfig implements IStaticConfig {
	public PROJECT_FILE_NAME = ".abproject";
	public DEBUG_PROJECT_FILE_NAME = ".debug.abproject";
	public RELEASE_PROJECT_FILE_NAME = ".release.abproject";
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

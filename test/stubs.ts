/* tslint:disable:no-empty */
import Future = require("fibers/future");
import * as util from "util";
import * as path from "path";

export class LoggerStub implements ILogger {
	constructor() {
		// uncomment when debugging unit tests to print to the console
		//this.setLevel("DEBUG");
	}

	setLevel(level: string): void { }
	getLevel(): string { return undefined; }
	fatal(formatStr: string, ...args: string[]): void { }
	error(formatStr: string, ...args: string[]): void { }
	warn(formatStr: string, ...args: string[]): void { }
	warnWithLabel(formatStr: string, ...args: string[]): void { }
	info(formatStr: string, ...args: string[]): void { }
	debug(formatStr: string, ...args: string[]): void { }
	trace(formatStr: string, ...args: string[]): void {
		// uncomment when debugging unit tests to print to the console
		//args.unshift(formatStr);
		//console.log(util.format.apply(null, args));
	}

	public output = "";

	out(formatStr: string, ...args: string[]): void {
		args.unshift(formatStr);
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args: string[]): void { }

	printMarkdown(...args: string[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}

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
	exists(path: string): boolean {
		return true;
	}

	deleteFile(path: string): void {
		return undefined;
	}

	deleteDirectory(directory: string): any {
		return null;
	}

	getFileSize(path: string): IFuture<number> {
		return undefined;
	}

	futureFromEvent(eventEmitter: NodeJS.EventEmitter, event: string): IFuture<any> {
		return undefined;
	}

	createDirectory(path: string): IFuture<void> {
		return undefined;
	}

	readDirectory(path: string): IFuture<string[]> {
		return Future.fromResult([]);
	}

	readFile(filename: string): IFuture<NodeBuffer> {
		return undefined;
	}

	readText(filename: string, encoding?: string): IFuture<string> {
		return Future.fromResult("");
	}

	readJson(filename: string, encoding?: string): IFuture<any> {
		return Future.fromResult({});
	}

	writeFile(filename: string, data: any, encoding?: string): IFuture<void> {
		return undefined;
	}

	appendFile(filename: string, data: any, encoding?: string): IFuture<void> {
		return undefined;
	}

	writeJson(filename: string, data: any, space?: string, encoding?: string): IFuture<void> {
		return Future.fromResult();
	}

	copyFile(sourceFileName: string, destinationFileName: string): IFuture<void> {
		return undefined;
	}

	openFile(filename: string): void { }

	createReadStream(path: string, options?: { flags?: string; encoding?: string; fd?: string; mode?: number; bufferSize?: number }): any {
		return undefined;
	}

	createWriteStream(path: string, options?: { flags?: string; encoding?: string; string?: string }): any {
		return undefined;
	}

	chmod(path: string, mode: any): IFuture<any> {
		return undefined;
	}

	getUniqueFileName(baseName: string): string {
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
		return Future.fromResult();
	}

	rename(oldPath: string, newPath: string): IFuture<void> {
		return undefined;
	}

	renameIfExists(oldPath: string, newPath: string): IFuture<boolean> {
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

	tryExecuteFileOperation(path: string, operation: () => IFuture<any>, enoentErrorMessage?: string): IFuture<void> {
		return undefined;
	}

	getFileShasum(fileName: string): IFuture<string> {
		return undefined;
	}

	readStdin(): IFuture<string> {
		return undefined;
	}

	rm(options: string, ...files: string[]) { }

	deleteEmptyParents(directory: string): IFuture<void> {
		return Future.fromResult();
	}

	getLsStats(path: string): IFuture<IFsStats> {
		return undefined;
	}
}

export class ErrorsStub implements IErrors {
	private impl: IErrors = new (require("../lib/common/errors").Errors)();

	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) {
		this.impl.fail.apply(this.impl, args);
	}

	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error(message);
	}

	beginCommand(action: () => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return action();
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }
}

export class ErrorsNoFailStub implements IErrors {

	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) { throw new Error(util.format.apply(null, args)); }
	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error(message);
	}

	beginCommand(action: () => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return (() => {
			try {
				let result = action().wait();
				return result;
			} catch (ex) {
				return false;
			}
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
	open(filename: string): void { }
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
	appResourcesDir: string;

	buildCordovaJsFilePath(version: string, platform: string): string {
		return undefined;
	}

	unpackAppResources(): IFuture<void> {
		return undefined;
	}

	downloadCordovaJsFiles(): IFuture<void> {
		return undefined;
	}

	get projectTemplatesDir(): string {
		return path.join(__dirname, "../resources/ProjectTemplates");
	}

	get itemTemplatesDir(): string {
		return path.join(__dirname, "../resources/ItemTemplates");
	}

	getTemplatesString(regexp: RegExp, replacementNames: IStringDictionary): IFuture<string> {
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
	getRulesFromFile(file: string): string[] {
		return [];
	}
	filterIgnoredFiles(files: string[], rules: string[]): string[] {
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

	public get capabilities(): Project.ICapabilities { return undefined; }

	public get defaultProjectTemplate(): string { return undefined; }

	public get liveSyncUrl(): string { return undefined; }

	public get requiredAndroidApiLevel(): number { return 0; }

	public get configFiles(): Project.IConfigurationFile[] { return undefined; }

	public get relativeAppResourcesPath(): string { return ''; }

	public get projectSpecificFiles(): string[] {
		return [];
	}

	public getValidationSchemaId(): string { return ""; }

	public getTemplateFilename(name: string): string {
		return util.format("Telerik.Mobile.%s.%s.zip", this.framework, name);
	}

	public projectTemplatesString(): IFuture<string> { return undefined; }

	public alterPropertiesForNewProject(properties: any, projectName: string): void { }

	public checkSdkVersions(platform: string, projectData: Project.IData): void { }

	public getProjectFileSchema(): IDictionary<any> { return undefined; }

	public getFullProjectFileSchema(): IFuture<any> { return undefined; }

	public getProjectTargets(projectDir: string): IFuture<string[]> { return undefined; }

	public adjustBuildProperties(buildProperties: any, projectInformation?: Project.IProjectInformation): any { return undefined; }

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): IFuture<void> { return undefined; }

	public getSimulatorParams(projectDir: string, projectData: Project.IData, simulatorPackageName: string): IFuture<string[]> { return undefined; }

	public completeProjectProperties(properties: any): boolean { return false; }

	public pluginsService: IPluginsService;

	public getPluginVariablesInfo(projectInformation: Project.IProjectInformation, projectDir?: string, configuration?: string): IFuture<IDictionary<IStringDictionary>> {
		return Future.fromResult(null);
	}

	public updateMigrationConfigFile(): IFuture<void> {
		return Future.fromResult(null);
	}

	public ensureProject(projectDir: string): IFuture<void> {
		return Future.fromResult(null);
	}

	public alterPropertiesForNewProjectBase(properties: any, projectName: string): void { /* No implementation required. */ }

	public getProjectFileSchemaByName(name: string): IDictionary<any> {
		return null;
	}

	public getProjectTargetsBase(projectDir: string, fileMask: RegExp): IFuture<string[]> {
		return Future.fromResult([]);
	}

	public printAssetUpdateMessage(): void { /* No implementation required. */ }

	public getProperty(propertyName: string, configuration: string, projectInformation: Project.IProjectInformation): any {
		return null;
	}
}

export class ProjectFilesManager implements IProjectFilesManager {
	public getProjectFiles(projectFilesPath: string, additionalExcludedProjectDirsAndFiles?: string[], filter?: (filePath: string, stat: IFsStats) => boolean, opts?: any): string[] {
		return undefined;
	}

	public isFileExcluded(filePath: string, additionalExcludedProjectDirsAndFiles?: string[]): boolean {
		return undefined;
	}

	public createLocalToDevicePaths(deviceAppData: Mobile.IDeviceAppData, projectFilesPath: string, projectFiles?: string[]): Mobile.ILocalToDevicePathData[] {
		return undefined;
	}

	public processPlatformSpecificFiles(directoryPath: string, platform: string, excludedDirs?: string[]): IFuture<void> {
		return undefined;
	}
}

export class StaticConfig implements IStaticConfig {
	public PROJECT_FILE_NAME = ".abproject";
	public CLIENT_NAME = "appbuilder";
	public ANALYTICS_API_KEY = "1234";
	public ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "1234";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "AnalyticsSettings.TrackFeatureUsage";
	public ERROR_REPORT_SETTING_NAME = "AnaliticsSettings.TrackExceptions";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";
	public SYS_REQUIREMENTS_LINK = "";
	public SOLUTION_SPACE_NAME = "Private_Build_Folder";
	public APP_RESOURCES_DIR_NAME = "App_Resources";
	public COMMAND_HELP_FILE_NAME = 'command-help.json';
	public RESOURCE_DIR_PATH = path.join(__dirname, "resources");
	public QR_SIZE = 300;
	public version = "1";
	helpTextPath = "help";
	adbFilePath = "adbFilePath";
	sevenZipFilePath = "7za";
	triggerJsonSchemaValidation = true;
	public get MAN_PAGES_DIR(): string {
		return path.join(__dirname, "../", "docs", "man_pages");
	}

	public get HTML_PAGES_DIR(): string {
		return path.join(__dirname, "../", "docs", "html");
	}

	public get HTML_COMMON_HELPERS_DIR(): string {
		return path.join(__dirname, "../lib/common", "docs", "helpers");
	}

	public get HTML_CLI_HELPERS_DIR(): string {
		return path.join(__dirname, "..", "docs", "helpers");
	}

	public get GITHUB_ACCESS_TOKEN_FILEPATH(): string {
		let tokenFileName = ".abgithub";
		return tokenFileName;
	}

	public get pathToPackageJson(): string {
		return path.join(__dirname, "..", "package.json");
	}

	public getAdbFilePath(): IFuture<string> {
		return Future.fromResult("");
	}

	public get PATH_TO_BOOTSTRAP(): string {
		return path.join(__dirname, "..", "lib", "bootstrap");
	}
}

export class HooksService implements IHooksService {
	get hookArgsName(): string {
		return "hookArgs";
	}
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

	validate(data: Project.IData): void { }

	isValid(data: Project.IData): boolean {
		return true;
	}

	tryResolveValidationSchema(framework: string): IDictionary<any> {
		return null;
	}

	getPropertyType(framework: string, propertyName: string): string {
		return "";
	}

	validateWithBuildSchema(data: Project.IData, platformName: string): void { }

	validatePropertyUsingBuildSchema(propertyName: string, propertyValue: string): void { }
}

export class PrompterStub implements IPrompter {
	public confirmResult = false;

	get(schema: IPromptSchema[]): IFuture<any> { return Future.fromResult(""); }
	getPassword(prompt: string, options?: { allowEmpty?: boolean }): IFuture<string> { return Future.fromResult(""); }
	getString(prompt: string): IFuture<string> { return Future.fromResult(""); }
	promptForChoice(promptMessage: string, choices: any[]): IFuture<string> { return Future.fromResult(""); }
	confirm(prompt: string, defaultAction?: () => boolean): IFuture<boolean> {
		return Future.fromResult(this.confirmResult);
	}
	dispose(): void { }
}

export class MessagesServiceStub implements IMessagesService {
	pathsToMessageJsonFiles: string[];

	getMessage(id: string, ...args: string[]): string { return util.format.apply(null, [ id ].concat(args)); }
}

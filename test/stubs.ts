/* tslint:disable:no-empty */
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
	async printMsgWithTimeout(message: string, timeout: number): Promise<void> {
		return null;
	}
}

export class FileSystemStub implements IFileSystem {
	async zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): Promise<void> {
		return undefined;
	}

	async unzip(zipFile: string, destination: string): Promise<void> {
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

	getFileSize(path: string): number {
		return undefined;
	}

	async futureFromEvent(eventEmitter: NodeJS.EventEmitter, event: string): Promise<any> {
		return undefined;
	}

	createDirectory(path: string): void {
		return undefined;
	}

	readDirectory(path: string): string[] {
		return [];
	}

	readFile(filename: string): NodeBuffer | string {
		return undefined;
	}

	readText(filename: string, encoding?: string): string {
		return "";
	}

	readJson(filename: string, encoding?: string): any {
		return {};
	}

	writeFile(filename: string, data: any, encoding?: string): void {
		return undefined;
	}

	appendFile(filename: string, data: any, encoding?: string): void {
		return undefined;
	}

	writeJson(filename: string, data: any, space?: string, encoding?: string): void { }

	copyFile(sourceFileName: string, destinationFileName: string): void {
		return undefined;
	}

	openFile(filename: string): void { }

	createReadStream(path: string, options?: { flags?: string; encoding?: string; fd?: string; mode?: number; bufferSize?: number }): any {
		return undefined;
	}

	createWriteStream(path: string, options?: { flags?: string; encoding?: string; string?: string }): any {
		return undefined;
	}

	chmod(path: string, mode: any): any {
		return undefined;
	}

	getUniqueFileName(baseName: string): string {
		return undefined;
	}

	getFsStats(path: string): IFsStats {
		return undefined;
	}

	isEmptyDir(directoryPath: string): boolean {
		return undefined;
	}

	isRelativePath(path: string): boolean {
		return false;
	}

	ensureDirectoryExists(directoryPath: string): void {
		return undefined;
	}

	rename(oldPath: string, newPath: string): void {
		return undefined;
	}

	renameIfExists(oldPath: string, newPath: string): boolean {
		return undefined;
	}

	symlink(sourePath: string, destinationPath: string): void {
		return undefined;
	}

	async setCurrentUserAsOwner(path: string, owner: string): Promise<void> {
		return undefined;
	}

	enumerateFilesInDirectorySync(directoryPath: string, filterCallback?: (file: string, stat: IFsStats) => boolean): string[] {
		return [];
	}

	async getFileShasum(fileName: string): Promise<string> {
		return undefined;
	}

	async readStdin(): Promise<string> {
		return undefined;
	}

	rm(options: string, ...files: string[]) { }

	deleteEmptyParents(directory: string): void { }

	getLsStats(path: string): IFsStats {
		return undefined;
	}
}

export class ErrorsStub implements IErrors {
	private impl: IErrors;

	constructor(private $injector: IInjector) {
		this.impl = new (require("../lib/common/errors").Errors)($injector);
	}

	printCallStack: boolean = false;

	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) {
		this.impl.fail.apply(this.impl, args);
	}

	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error(message);
	}

	async beginCommand(action: () => Promise<boolean>, printHelpCommand: () => Promise<boolean>): Promise<boolean> {
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

	async beginCommand(action: () => Promise<boolean>, printHelpCommand: () => Promise<boolean>): Promise<boolean> {
		try {
			let result = await action();
			return result;
		} catch (ex) {
			return false;
		}
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
	async basicLogin(userName: string, password: string): Promise<void> {
		return undefined;
	}

	async login(): Promise<void> {
		return undefined;
	}

	async logout(): Promise<void> {
		return undefined;
	}

	async isLoggedIn(): Promise<boolean> {
		return Promise.resolve(false);
	}

	async ensureLoggedIn(): Promise<void> {
		return undefined;
	}

	async telerikLogin(user: string, password: string): Promise<void> {
		return undefined;
	}
}

export class TemplateServiceStub implements ITemplatesService {
	appResourcesDir: string;

	buildCordovaJsFilePath(version: string, platform: string): string {
		return undefined;
	}

	async unpackAppResources(): Promise<void> {
		return undefined;
	}

	async downloadCordovaJsFiles(): Promise<void> {
		return undefined;
	}

	get projectTemplatesDir(): string {
		return path.join(__dirname, "../resources/ProjectTemplates");
	}

	get itemTemplatesDir(): string {
		return path.join(__dirname, "../resources/ItemTemplates");
	}

	getTemplatesString(regexp: RegExp, replacementNames: IStringDictionary): string {
		return undefined;
	}

	async downloadProjectTemplates(): Promise<void> {
		return undefined;
	}

	async downloadItemTemplates(): Promise<void> {
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

	public getProjectTemplatesString(): string { return undefined; }

	public alterPropertiesForNewProject(properties: any, projectName: string): void { }

	public checkSdkVersions(platform: string, projectData: Project.IData): void { }

	public getProjectFileSchema(): IDictionary<any> { return undefined; }

	public async getFullProjectFileSchema(): Promise<any> { return undefined; }

	public getProjectTargets(projectDir: string): string[] { return undefined; }

	public adjustBuildProperties(buildProperties: any, projectInformation?: Project.IProjectInformation): any { return undefined; }

	public ensureAllPlatformAssets(projectDir: string, frameworkVersion: string): void { return undefined; }

	public async getSimulatorParams(projectDir: string, projectData: Project.IData, simulatorPackageName: string): Promise<string[]> { return undefined; }

	public completeProjectProperties(properties: any): boolean { return false; }

	public pluginsService: IPluginsService;

	public getPluginVariablesInfo(projectInformation: Project.IProjectInformation, projectDir?: string, configuration?: string): IDictionary<IStringDictionary> {
		return null;
	}

	public async updateMigrationConfigFile(): Promise<void> {
		return Promise.resolve(null);
	}

	public async ensureProject(projectDir: string): Promise<void> {
		return Promise.resolve(null);
	}

	public alterPropertiesForNewProjectBase(properties: any, projectName: string): void { /* No implementation required. */ }

	public getProjectFileSchemaByName(name: string): IDictionary<any> {
		return null;
	}

	public getProjectTargetsBase(projectDir: string, fileMask: RegExp): string[] {
		return [];
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

	public createLocalToDevicePaths(deviceAppData: Mobile.IDeviceAppData, projectFilesPath: string, projectFiles?: string[]): Promise<Mobile.ILocalToDevicePathData[]> {
		return undefined;
	}

	public processPlatformSpecificFiles(directoryPath: string, platform: string, excludedDirs?: string[]): void {
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

	public async getAdbFilePath(): Promise<string> {
		return Promise.resolve("");
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
	async executeBeforeHooks(): Promise<void> {
	}
	async executeAfterHooks(): Promise<void> {
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

	async get(schema: IPromptSchema[]): Promise<any> { return Promise.resolve(""); }
	async getPassword(prompt: string, options?: { allowEmpty?: boolean }): Promise<string> { return Promise.resolve(""); }
	async getString(prompt: string): Promise<string> { return Promise.resolve(""); }
	async promptForChoice(promptMessage: string, choices: any[]): Promise<string> { return Promise.resolve(""); }
	async confirm(prompt: string, defaultAction?: () => boolean): Promise<boolean> {
		return Promise.resolve(this.confirmResult);
	}
	dispose(): void { }
}

export class MessagesServiceStub implements IMessagesService {
	pathsToMessageJsonFiles: string[];

	getMessage(id: string, ...args: string[]): string { return util.format.apply(null, [id].concat(args)); }
}

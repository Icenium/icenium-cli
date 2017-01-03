import * as os from "os";

export class DebugCommand implements ICommand {
	private debuggerPath: string;
	protected platform: string;

	constructor(protected $logger: ILogger,
		protected $errors: IErrors,
		protected $hostCapabilities: IHostCapabilities,
		protected $loginManager: ILoginManager,
		protected $serverExtensionsService: IServerExtensionsService,
		protected $sharedUserSettingsService: IUserSettingsService,
		protected $sharedUserSettingsFileService: IUserSettingsFileService,
		protected $processInfo: IProcessInfo,
		protected $project: Project.IProject,
		protected $winDebuggerService: IExtensionPlatformServices,
		protected $hostInfo: IHostInfo,
		protected $darwinDebuggerService: IDebuggerService) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		await this.$loginManager.ensureLoggedIn();
		await this.$project.ensureProject();

		await this.runDebugger();
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!this.$hostCapabilities.capabilities[process.platform].debugToolsSupported) {
			this.$errors.fail("In this version of the Telerik AppBuilder CLI, you cannot run the debug tools on %s. The debug tools for %s will become available in a future release of the Telerik AppBuilder CLI.", process.platform, process.platform);
		}

		return this.$hostInfo.isDarwin ? Promise.resolve(true) : this.$winDebuggerService.canRunApplication();
	}

	protected async runDebugger(): Promise<void> {
		if (this.$hostInfo.isWindows) {
			this.$logger.info("Starting debugger...");

			let debuggerPackageName = this.$winDebuggerService.packageName;
			this.debuggerPath = this.$serverExtensionsService.getExtensionPath(debuggerPackageName);
			await this.$serverExtensionsService.prepareExtension(debuggerPackageName, this.ensureDebuggerIsNotRunning.bind(this));

			await this.$sharedUserSettingsService.loadUserSettingsFile();

			let debuggerParams = [
				"--user-settings", this.$sharedUserSettingsFileService.userSettingsFilePath,
				await "--app-ids", this.$project.getAppIdentifierForPlatform(this.platform) // We can specify more than one appid. They should be separated with ;.
			];

			this.$winDebuggerService.runApplication(this.debuggerPath, debuggerParams);
		}
	}

	private async ensureDebuggerIsNotRunning(): Promise<void> {
		let isRunning = await this.$processInfo.isRunning(this.$winDebuggerService.executableName);
		if (isRunning) {
			this.$errors.failWithoutHelp("AppBuilder Debugger is currently running and cannot be updated." + os.EOL +
				"Close it and run $ appbuilder debug again.");
		}
	}
}

export class DebugAndroidCommand extends DebugCommand {
	constructor(private $projectConstants: Project.IConstants,
		$logger: ILogger,
		$errors: IErrors,
		$hostCapabilities: IHostCapabilities,
		$loginManager: ILoginManager,
		$serverExtensionsService: IServerExtensionsService,
		$sharedUserSettingsService: IUserSettingsService,
		$sharedUserSettingsFileService: IUserSettingsFileService,
		$processInfo: IProcessInfo,
		$project: Project.IProject,
		$winDebuggerService: IExtensionPlatformServices,
		$hostInfo: IHostInfo,
		$darwinDebuggerService: IDebuggerService) {
		super($logger,
			$errors,
			$hostCapabilities,
			$loginManager,
			$serverExtensionsService,
			$sharedUserSettingsService,
			$sharedUserSettingsFileService,
			$processInfo,
			$project,
			$winDebuggerService,
			$hostInfo,
			$darwinDebuggerService);

		this.platform = this.$projectConstants.ANDROID_PLATFORM_NAME;
	}

	protected async runDebugger(): Promise<void> {
		await super.runDebugger();

		if (!this.$hostInfo.isWindows) {
			await this.$darwinDebuggerService.debugAndroidApplication(await this.$project.getAppIdentifierForPlatform(this.platform), this.$project.projectData.Framework);
		}
	}
}

$injector.registerCommand("debug|android", DebugAndroidCommand);

export class DebugIosCommand extends DebugCommand {
	constructor($logger: ILogger,
		$errors: IErrors,
		$hostCapabilities: IHostCapabilities,
		$loginManager: ILoginManager,
		$serverExtensionsService: IServerExtensionsService,
		$sharedUserSettingsService: IUserSettingsService,
		$sharedUserSettingsFileService: IUserSettingsFileService,
		$processInfo: IProcessInfo,
		$project: Project.IProject,
		$winDebuggerService: IExtensionPlatformServices,
		$hostInfo: IHostInfo,
		$darwinDebuggerService: IDebuggerService) {
		super($logger,
			$errors,
			$hostCapabilities,
			$loginManager,
			$serverExtensionsService,
			$sharedUserSettingsService,
			$sharedUserSettingsFileService,
			$processInfo,
			$project,
			$winDebuggerService,
			$hostInfo,
			$darwinDebuggerService);
	}

	protected async runDebugger(): Promise<void> {
		await super.runDebugger();

		if (!this.$hostInfo.isWindows) {
			this.$darwinDebuggerService.debugIosApplication(this.$project.projectData.AppIdentifier);
		}
	}
}

$injector.registerCommand("debug|ios", DebugIosCommand);

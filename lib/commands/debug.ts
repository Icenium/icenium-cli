import * as os from "os";
import Future = require("fibers/future");

export class DebugCommand implements ICommand {
	private debuggerPath: string;

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

	allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();
			this.$project.ensureProject();

			this.runDebugger().wait();
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		if (!this.$hostCapabilities.capabilities[process.platform].debugToolsSupported) {
			this.$errors.fail("In this version of the Telerik AppBuilder CLI, you cannot run the debug tools on %s. The debug tools for %s will become available in a future release of the Telerik AppBuilder CLI.", process.platform, process.platform);
		}

		return this.$hostInfo.isDarwin ? Future.fromResult(true) : this.$winDebuggerService.canRunApplication();
	}

	protected runDebugger(): IFuture<void> {
		return (() => {
			if (this.$hostInfo.isWindows) {
				this.$logger.info("Starting debugger...");

				let debuggerPackageName = this.$winDebuggerService.packageName;
				this.debuggerPath = this.$serverExtensionsService.getExtensionPath(debuggerPackageName);
				this.$serverExtensionsService.prepareExtension(debuggerPackageName, this.ensureDebuggerIsNotRunning.bind(this)).wait();

				this.$sharedUserSettingsService.loadUserSettingsFile().wait();

				let debuggerParams = [
					"--user-settings", this.$sharedUserSettingsFileService.userSettingsFilePath,
					"--app-ids", this.$project.projectData.AppIdentifier // We can specify more than one appid. They should be separated with ;.
				];

				this.$winDebuggerService.runApplication(this.debuggerPath, debuggerParams);
			}
		}).future<void>()();
	}

	private ensureDebuggerIsNotRunning(): IFuture<void> {
		return (() => {
			let isRunning = this.$processInfo.isRunning(this.$winDebuggerService.executableName).wait();
			if (isRunning) {
				this.$errors.failWithoutHelp("AppBuilder Debugger is currently running and cannot be updated." + os.EOL +
					"Close it and run $ appbuilder debug again.");
			}
		}).future<void>()();
	}
}

export class DebugAndroidCommand extends DebugCommand {
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

	protected runDebugger(): IFuture<void> {
		return (() => {
			super.runDebugger().wait();

			if (!this.$hostInfo.isWindows) {
				this.$darwinDebuggerService.debugAndroidApplication(this.$project.projectData.AppIdentifier).wait();
			}
		}).future<void>()();
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

	protected runDebugger(): IFuture<void> {
		return (() => {
			super.runDebugger().wait();

			if (!this.$hostInfo.isWindows) {
				this.$darwinDebuggerService.debugIosApplication(this.$project.projectData.AppIdentifier);
			}
		}).future<void>()();
	}
}

$injector.registerCommand("debug|ios", DebugIosCommand);

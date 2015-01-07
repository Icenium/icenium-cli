///<reference path="../.d.ts"/>
"use strict";
import os = require("os");
import child_process = require("child_process");
import path = require("path");
import Future = require("fibers/future");
import helpers = require("../helpers");
import watchr = require("watchr");
import MobileHelper = require("./../common/mobile/mobile-helper");
import hostInfo = require("../host-info");

export class DebugCommand implements ICommand {
	private debuggerPath: string;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $loginManager: ILoginManager,
		private $debuggerPlatformServices: IExtensionPlatformServices,
		private $serverExtensionsService: IServerExtensionsService,
		private $sharedUserSettingsService: IUserSettingsService,
		private $sharedUserSettingsFileService: IUserSettingsFileService,
		private $processInfo: IProcessInfo) {
	}

	allowedParameters: ICommandParameter[];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(!hostInfo.hostCapabilities[process.platform].debugToolsSupported) {
				this.$errors.fail("In this version of the Telerik AppBuilder CLI, you cannot run the debug tools on Linux. The debug tools for Linux will become available in a future release of the Telerik AppBuilder CLI.");
			}

			this.$loginManager.ensureLoggedIn().wait();

			var debuggerPackageName = this.$debuggerPlatformServices.getPackageName();
			this.debuggerPath = this.$serverExtensionsService.getExtensionPath(debuggerPackageName);
			this.$serverExtensionsService.prepareExtension(debuggerPackageName, this.ensureDebuggerIsNotRunning.bind(this)).wait();

			this.runDebugger().wait();
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return this.$debuggerPlatformServices.canRunApplication();
	}

	private runDebugger(): IFuture<void>{
		return (() => {
			this.$logger.info("Starting debugger...");
			this.$sharedUserSettingsService.loadUserSettingsFile().wait();

			var debuggerParams = [
				"--user-settings", this.$sharedUserSettingsFileService.userSettingsFilePath,
				];

			this.$debuggerPlatformServices.runApplication(this.debuggerPath, debuggerParams);
		}).future<void >()();
	}

	private ensureDebuggerIsNotRunning(): void {
		var isRunning = this.$processInfo.isRunning(this.$debuggerPlatformServices.executableName).wait();
		if (isRunning) {
			this.$errors.fail({formatStr: "AppBuilder Debugger is currently running and cannot be updated." + os.EOL +
			"Close it and run $ appbuilder debug again.", suppressCommandHelp: true});
		}
	}
}
$injector.registerCommand("debug", DebugCommand);

class BaseDebuggerPlatformServices {

	constructor(private $sharedUserSettingsFileService: IUserSettingsFileService,
		private $sharedUserSettingsService: IUserSettingsService,
		protected $errors: IErrors,
		private $logger: ILogger,
		private $dispatcher: IFutureDispatcher) { }

	public startWatchingUserSettingsFile(): void {
		watchr.watch({
			paths: [this.$sharedUserSettingsFileService.userSettingsFilePath],
			listeners: {
				error: (error: Error) => { this.$errors.fail(error.toString()); },
				change: (changeType: string, filePath: string) => { this.$dispatcher.dispatch(() => this.$sharedUserSettingsService.saveSettings({})); },
				next: (error: Error, _watchers: any) => {
					var watchers: watchr.IWatcherInstance[] = _watchers;
					if (error) {
						this.$errors.fail(error.toString());
					}

					this.$logger.trace("User settings watchers are stopping.");
					_.each(watchers, (watcher) => watcher.close());
					this.$logger.trace("User settings watchers are stopped.");
				}
			}
		});
	}

	public waitDebuggerExit(childProcess: child_process.ChildProcess) {
		//TODO: Darwin only - Prevent printing of all devtools log on the console.

		childProcess.stderr.pipe(process.stderr);
		childProcess.stdin.on("end", () => process.exit());
		helpers.exitOnStdinEnd();
		this.$dispatcher.run();
	}
}

class WinDebuggerPlatformServices extends  BaseDebuggerPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Tools.Package";
	private static EXECUTABLE_NAME_WIN = "Debugger.Windows.exe";

	constructor(private $childProcess: IChildProcess,
		$errors: IErrors,
		$logger: ILogger,
		$sharedUserSettingsFileService: IUserSettingsFileService,
		$sharedUserSettingsService: IUserSettingsService,
		$dispatcher: IFutureDispatcher) {
		super($sharedUserSettingsFileService, $sharedUserSettingsService, $errors, $logger, $dispatcher);
	}

	public getPackageName(): string {
		return WinDebuggerPlatformServices.PACKAGE_NAME_WIN;
	}

	public get executableName(): string {
		return WinDebuggerPlatformServices.EXECUTABLE_NAME_WIN;
	}

	public runApplication(applicationPath: string, applicationParams: string[]): void {
		this.startWatchingUserSettingsFile();

		var debuggerBinary = path.join(applicationPath, WinDebuggerPlatformServices.EXECUTABLE_NAME_WIN);
		var childProcess: child_process.ChildProcess = this.$childProcess.spawn(debuggerBinary, applicationParams);
		this.waitDebuggerExit(childProcess);
	}

	public canRunApplication(): IFuture<boolean> {
		return hostInfo.isDotNet40Installed("Unable to start the debug tool. Verify that you have installed .NET 4.0 or later and try again.");
	}
}

class DarwinDebuggerPlatformServices extends BaseDebuggerPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_OSX: string = "Telerik.BlackDragon.Client.Mobile.Tools.Mac.Package";
	private static EXECUTABLE_NAME_OSX_SHORT = "AppBuilder Debugger";
	public static EXECUTABLE_NAME_OSX = DarwinDebuggerPlatformServices.EXECUTABLE_NAME_OSX_SHORT + ".app";

	constructor(private $childProcess: IChildProcess,
		$errors: IErrors,
		$logger: ILogger,
		$sharedUserSettingsFileService: IUserSettingsFileService,
		$sharedUserSettingsService: IUserSettingsService,
		$dispatcher: IFutureDispatcher) {
		super($sharedUserSettingsFileService, $sharedUserSettingsService, $errors, $logger, $dispatcher);
	}

	public getPackageName(): string {
		return DarwinDebuggerPlatformServices.PACKAGE_NAME_OSX;
	}

	public get executableName(): string {
		return DarwinDebuggerPlatformServices.EXECUTABLE_NAME_OSX_SHORT;
	}

	public runApplication(applicationPath: string, applicationParams: string[]): void {
		this.startWatchingUserSettingsFile();

		var debuggerBinary = path.join(applicationPath, DarwinDebuggerPlatformServices.EXECUTABLE_NAME_OSX);
		var commandLine = [debuggerBinary, '--args'].concat(applicationParams);
		this.$childProcess.spawn('open', commandLine,
			{ stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
	}

	public canRunApplication(): IFuture<boolean> {
		return (() => true).future<boolean>()();
	}
}

if (hostInfo.isWindows()) {
	$injector.register("debuggerPlatformServices", WinDebuggerPlatformServices);
} else if (hostInfo.isDarwin()) {
	$injector.register("debuggerPlatformServices", DarwinDebuggerPlatformServices);
} else {
	$injector.register("debuggerPlatformServices", {}); // for unsupported OSes
}

///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Future = require("fibers/future");
import helpers = require("../helpers");
import watchr = require("watchr");

export class DebugCommand implements ICommand {
	private debuggerPath: string;

	constructor(private $logger: ILogger,
		private $loginManager: ILoginManager,
		private $debuggerPlatformServices: IExtensionPlatformServices,
		private $serverExtensionsService: IServerExtensionsService,
		private $sharedUserSettingsService: IUserSettingsService,
		private $sharedUserSettingsFileService: IUserSettingsFileService) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			var debuggerPackageName = this.$debuggerPlatformServices.getPackageName();
			this.debuggerPath = this.$serverExtensionsService.getExtensionPath(debuggerPackageName);
			this.$serverExtensionsService.prepareExtension(debuggerPackageName).wait();

			this.runDebugger().wait();
		}).future<void>()();
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
}
$injector.registerCommand("debug", DebugCommand);

class BaseDebuggerPlatformServices {

	constructor(private $sharedUserSettingsFileService: IUserSettingsFileService,
		private $sharedUserSettingsService: IUserSettingsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $dispatcher: IFutureDispatcher) { }

	public startWatchingUserSettingsFile(): void {
		watchr.watch({
			paths: [this.$sharedUserSettingsFileService.userSettingsFilePath],
			listeners: {
				error: (error) => {
					this.$errors.fail(error);
				},
				change: (changeType, filePath) => {
					this.$dispatcher.dispatch(() => this.$sharedUserSettingsService.saveSettings({}));
				},
				next: (error, watchers) => {
					if (error) {
						this.$errors.fail(error);
					}

					this.$logger.trace("User settings watchers are stopping.");
					for (var i = 0; i < watchers.length; i++) {
						watchers[i].close();
					}
					this.$logger.trace("User settings watchers are stopped.");
				}
			}
		});
	}

	public waitDebuggerExit(childProcess: any) {
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

	public runApplication(applicationPath: string, applicationParams: string[]) {
		this.startWatchingUserSettingsFile();

		var debuggerBinary = path.join(applicationPath, WinDebuggerPlatformServices.EXECUTABLE_NAME_WIN);
		var childProcess = this.$childProcess.spawn(debuggerBinary, applicationParams);
		this.waitDebuggerExit(childProcess);
	}
}

class DarwinDebuggerPlatformServices extends BaseDebuggerPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_OSX: string = "Telerik.BlackDragon.Client.Mobile.Debugger.Mac.Package";
	private static EXECUTABLE_NAME_OSX = "AppBuilder Debugger.app";

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

	public runApplication(applicationPath: string, applicationParams: string[]) {
		this.startWatchingUserSettingsFile();

		var debuggerBinary = path.join(applicationPath, DarwinDebuggerPlatformServices.EXECUTABLE_NAME_OSX);
		var commandLine = [debuggerBinary, '--args'].concat(applicationParams);
		var childProcess = this.$childProcess.spawn('open', commandLine,
			{ stdio:  ["ignore", "ignore", "ignore"], detached: true });
		childProcess.unref();
	}
}

if (helpers.isWindows()) {
	$injector.register("debuggerPlatformServices", WinDebuggerPlatformServices);
} else if (helpers.isDarwin()) {
	$injector.register("debuggerPlatformServices", DarwinDebuggerPlatformServices);
}

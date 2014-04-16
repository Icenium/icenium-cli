///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import options = require("../options");
import Future = require("fibers/future");
import helpers = require("../helpers");
import watchr = require("watchr");

export class DebugCommand implements ICommand {
	private debuggerPath: string;

	constructor(private $logger: ILogger,
		private $loginManager: ILoginManager,
		private $debuggerPlatformServices: IExtensionPlatformServices,
		private $serverExtensionsService: IServerExtensionsService,
		private $sharedUserSettingsService: IUserSettingsService) {
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
				"--user-settings", this.$sharedUserSettingsService.userSettingsFilePath,
				];

			this.$debuggerPlatformServices.runApplication(this.debuggerPath, debuggerParams);
		}).future<void >()();
	}
}
$injector.registerCommand("debug", DebugCommand);

class WinDebuggerPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Debugger.Package";
	private static EXECUTABLE_NAME_WIN = "Debugger.Windows.exe";

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger,
		private $sharedUserSettingsService: IUserSettingsService,
		private $dispatcher: IFutureDispatcher) {
	}

	public getPackageName(): string {
		return WinDebuggerPlatformServices.PACKAGE_NAME_WIN;
	}

	public runApplication(applicationPath: string, applicationParams: string[]) {
		this.startWatchingUserSettingsFile();

		var debuggerBinary = path.join(applicationPath, WinDebuggerPlatformServices.EXECUTABLE_NAME_WIN);
		var childProcess = this.$childProcess.spawn(debuggerBinary, applicationParams);
		childProcess.stderr.pipe(process.stderr);
		childProcess.stdin.on("end", () => process.exit());
		helpers.exitOnStdinEnd();
		this.$dispatcher.run();
	}

	private startWatchingUserSettingsFile(): void {
		watchr.watch({
			paths: [this.$sharedUserSettingsService.userSettingsFilePath],
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
}

if (helpers.isWindows()) {
	$injector.register("debuggerPlatformServices", WinDebuggerPlatformServices);
} else if (helpers.isDarwin()) {
	//darwin version comming soon
}

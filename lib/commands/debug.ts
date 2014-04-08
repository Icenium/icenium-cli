///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import options = require("../options");
import Future = require("fibers/future");
import helpers = require("../helpers");

export class DebugCommand implements ICommand {
	private debuggerPath: string;

	constructor(private $logger: ILogger,
		private $loginManager: ILoginManager,
		private $debuggerPlatformServices: IExtensionPlatformServices,
		private $serverExtensionsService: IServerExtensionsService) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			var debuggerPackageName = this.$debuggerPlatformServices.getPackageName();
			this.debuggerPath = this.$serverExtensionsService.getExtensionPath(debuggerPackageName);
			this.$serverExtensionsService.prepareExtension(debuggerPackageName).wait();

			this.runDebugger();
		}).future<void>()();
	}

	private runDebugger() {
		this.$logger.info("Starting debugger...");

		var debuggerParams = [
			"--user-settings", path.join(options["profile-dir"], "user-settings.xml"),
			];

		this.$debuggerPlatformServices.runApplication(this.debuggerPath, debuggerParams);
	}
}
$injector.registerCommand("debug", DebugCommand);

class WinDebuggerPlatformServices implements IExtensionPlatformServices {
	private static PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Debugger.Package";
	private static EXECUTABLE_NAME_WIN = "Debugger.Windows.exe";

	constructor(private $childProcess: IChildProcess) {
	}

	public getPackageName(): string {
		return WinDebuggerPlatformServices.PACKAGE_NAME_WIN;
	}

	public runApplication(applicationPath: string, applicationParams: string[]) {
		var debuggerBinary = path.join(applicationPath, WinDebuggerPlatformServices.EXECUTABLE_NAME_WIN);
		var childProcess = this.$childProcess.spawn(debuggerBinary, applicationParams,
			{ stdio: ["ignore", "ignore", "ignore"], detached: true });
		childProcess.unref();
	}
}

if (helpers.isWindows()) {
	$injector.register("debuggerPlatformServices", WinDebuggerPlatformServices);
} else if (helpers.isDarwin()) {
	//darwin version comming soon
}

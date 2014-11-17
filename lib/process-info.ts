///<reference path=".d.ts"/>
"use strict";

import hostInfo = require("./common/host-info");
import helpers = require("./common/helpers");
import Future = require("fibers/future");

export class ProcessInfo implements IProcessInfo {
	constructor(
		private $childProcess: IChildProcess
	) { }

	public isRunning(name: string): IFuture<boolean> {
		return (() => {
			var result: boolean;

			if (hostInfo.isWindows()) {
				if (!name.toLowerCase().endsWith(".exe")) {
					name = name + ".exe";
				}
				// windows returns localized text whether the app is running or not. But when it is running, the name of the process is in the output
				result = this.$childProcess.spawnFromEvent("tasklist.exe", ["/fi", 'imagename eq ' + name], "close").wait().stdout.indexOf(name) !== -1;
			} else if (hostInfo.isDarwin()) {
				result = this.$childProcess.spawnFromEvent("ps", ["xc"], "close").wait().stdout.indexOf(name) !== -1;
			} else if (hostInfo.isLinux()) {
				result = !helpers.isNullOrWhitespace(this.$childProcess.spawnFromEvent("ps", ["--no-headers", "-C", name], "close").wait().stdout);
			}

			return result;
		}).future<boolean>()();
	}
}

$injector.register("processInfo", ProcessInfo);

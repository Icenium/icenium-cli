///<reference path=".d.ts"/>
"use strict";

import hostInfo = require("./common/host-info");
import helpers = require("./common/helpers");
import Future = require("fibers/future");

export class ProcessInfo implements IProcessInfo {
	constructor(
		private $childProcess: IChildProcess
	) { }

	public isRunning(name: string): IFuture<string[]> {
		return (() => {
			var result: boolean;

			if (hostInfo.isWindows()) {
				if (!name.toLowerCase().endsWith(".exe")) {
					name = name + ".exe";
				}
				// windows returns localized text whether the app is running or not. But when it is running, the name of the process is in the output
				result = this.$childProcess.spawnFromEvent("tasklist.exe", ["/fi", 'imagename eq ' + name], "close").wait().stdout.indexOf(name) !== -1;
			} else if (hostInfo.isDarwin()) {
				result = !helpers.isNullOrWhitespace(this.whoGrepsHeFinds(name).wait());
			} else if (hostInfo.isLinux()) {
				result = !helpers.isNullOrWhitespace(this.$childProcess.spawnFromEvent("ps", ["--no-headers", "-C", name], "close").wait().stdout);
			}

			return result;
		}).future<string[]>()();
	}

	private whoGrepsHeFinds(name: string): IFuture<string> {
		var spawn = require('child_process').spawn,
			ps    = spawn('ps', ['xc']),
			grep  = spawn('grep', [name]),
			result = new Future<string>();

		ps.stdout.on('data', (data:any) => grep.stdin.write(data));
		ps.on('close', () => grep.stdin.end());
		grep.stdout.on('data', (data:any) => result.return('' + data));

		return result;
	}
}

$injector.register("processInfo", ProcessInfo);

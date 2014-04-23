///<reference path="../.d.ts"/>
"use strict";

import watchr = require("watchr");
import path = require("path");
var options: any = require("../options");

export class CancellationService implements ICancellationService {
	private watches = {};

	constructor(private $fs: IFileSystem,
		private $errors: IErrors) {
		this.$fs.createDirectory(CancellationService.killSwitchDir).wait();
	}

	public begin(name: string): void {
		var triggerFile = CancellationService.makeKillSwitchFileName(name);

		this.$fs.createWriteStream(triggerFile).end();

		var watcher = watchr.watch({
			path: triggerFile,
			listeners: {
				error: (error) => {
					this.$errors.fail(error);
				},
				change: (changeType, filePath) => {
					if (changeType === "delete") {
						process.exit();
					}
				}
			}
		});

		this.watches[name] = watcher;
	}

	public end(name: string): void {
		var watcher = this.watches[name];
		delete this.watches[name];
		watcher.close();
	}

	public dispose(): void {
		Object.keys(this.watches).forEach((name) => {
			this.end(name);
		})
	}

	private static get killSwitchDir(): string {
		return path.join(options["profile-dir"], "KillSwitches");
	}

	private static makeKillSwitchFileName(name: string): string {
		return path.join(CancellationService.killSwitchDir, name);
	}
}
$injector.register("cancellation", CancellationService);
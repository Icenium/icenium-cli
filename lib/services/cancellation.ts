///<reference path="../.d.ts"/>
"use strict";

import watchr = require("watchr");
import path = require("path");
var options: any = require("../options");
import Future = require("fibers/future");

export class CancellationService implements ICancellationService {
	private watches = {};

	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $errors: IErrors) {
		this.$fs.createDirectory(CancellationService.killSwitchDir).wait();
	}

	public begin(name: string): IFuture<void> {
		return (() => {
			var triggerFile = CancellationService.makeKillSwitchFileName(name);

			var stream = this.$fs.createWriteStream(triggerFile);
			var streamEnd = this.$fs.futureFromEvent(stream, "finish");
			stream.end();
			streamEnd.wait();

			this.$logger.trace("Starting watch on killswitch %s", triggerFile);
			var watcherInitialized = new Future;
			watchr.watch({
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
				},
				next: (err, watcherInstance) => {
					if (err) {
						watcherInitialized.throw(err);
					} else {
						watcherInitialized.return(watcherInstance);
					}
				}
			});

			var watcher = watcherInitialized.wait();

			if (watcher) {
				this.watches[name] = watcher;
			}
		}).future<void>()();
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
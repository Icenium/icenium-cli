///<reference path="../.d.ts"/>
"use strict";

import plugman = require("plugman");
import path = require("path");
import util = require("util");
import os = require("os");
import validUrl = require("valid-url");
import Future = require("fibers/future");

export interface IPlugin {
	name: string;
}

export class CordovaPluginsService {
	constructor(private $project: Project.IProject,
		private $config: IConfiguration) { }

	public getPlugins(keywords: string[]): IPlugin[] {
		this.configure();
		return this.search(keywords);
	}

	public search(keywords: string[]): IPlugin[] {
		var future = new Future<IPlugin[]>();
		plugman.search(keywords, (result) => {
			if (this.isError(result)) {
				future.throw(result);
			} else {
				future.return(result);
			}
		});
		return future.wait();
	}

	public fetch(pluginId: string): string {
		this.$project.ensureProject();
		var future = new Future<string>();
		plugman.fetch(pluginId, this.getPluginsDir(), false, ".", "HEAD", (result) => {
			if (this.isError(result)) {
				future.throw(result);
			} else {
				var message = util.format("The plugin has been successfully fetched to %s", result);
				future.return(message);
			}
		});
		return future.wait();
	}

	public configure(): void {
		var future = new Future();
		var params = ["set", "registry", this.$config.CORDOVA_PLUGINS_REGISTRY];
		plugman.config(params, (result) => {
			if (this.isError(result)) {
				future.throw(result);
			} else {
				future.return(result);
			}
		});
		future.wait();
	}

	private isError(object:any): boolean {
		return object instanceof Error;
	}

	private getPluginsDir() {
		return path.join(this.$project.getProjectDir(), "plugins");
	}
}
$injector.register("cordovaPluginsService", CordovaPluginsService);
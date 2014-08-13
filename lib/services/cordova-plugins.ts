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
	description: string;
	version: string;
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

	public fetch(pluginId: string): IFuture<string> {
		return(() => {
			this.$project.ensureProject();
			var future = new Future<string>();
			plugman.fetch(pluginId, this.getPluginsDir().wait(), false, ".", "HEAD", (result) => {
				if (this.isError(result)) {
					future.throw(result);
				} else {
					future.return(util.format("The plugin has been successfully fetched to %s", result));
				}
			});
			return future.wait();
		}).future<string>()();
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

	private getPluginsDir(): IFuture<string> {
		return(() => {
			return path.join(this.$project.getProjectDir().wait(), "plugins");
		}).future<string>()();
	}
}
$injector.register("cordovaPluginsService", CordovaPluginsService);
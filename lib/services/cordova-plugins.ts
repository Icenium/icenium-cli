///<reference path="../.d.ts"/>
"use strict";

import plugman = require("plugman");
import path = require("path");
import util = require("util");
import os = require("os");
import validUrl = require("valid-url");
import Future = require("fibers/future");
import PluginsServiceBaseLib = require("./plugins-service-base");

export class CordovaPluginsService extends PluginsServiceBaseLib.PluginsServiceBase {
	constructor(private $cordovaMigrationService: ICordovaMigrationService,
		private $project: Project.IProject,
		private $config: IConfiguration) {
		super();
	}

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

	public getInstalledPlugins(): IFuture<IPlugin[]> {
		return (() => {
			var plugins = _.filter(this.$project.projectData.CorePlugins, (pluginName: string) => this.isCordovaPlugin(pluginName));
			return this.getMappedPlugins(plugins);
		}).future<IPlugin[]>()();
	}

	public getAvailablePlugins(): IFuture<IPlugin[]> {
		return (() => {
			var version = this.$project.projectData.FrameworkVersion;
			var plugins = this.$cordovaMigrationService.pluginsForVersion(version).wait();
			return this.getMappedPlugins(plugins);
		}).future<IPlugin[]>()();
	}

	private getMappedPlugins(plugins: string[]): IPlugin[] {
		return _.map(plugins, pluginName => {
			var pluginType = this.getPluginTypeByName(pluginName);
			return new PluginsServiceBaseLib.CordovaPluginData(pluginName, pluginType);
		});
	}

	public isCordovaPlugin(pluginName: string): boolean {
		var pluginType = this.getPluginTypeByName(pluginName);
		return pluginType === PluginsServiceBaseLib.PluginType.CorePlugin || pluginType === PluginsServiceBaseLib.PluginType.AdvancedPlugin;
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
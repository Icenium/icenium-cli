///<reference path="../.d.ts"/>
"use strict";

import plugman = require("plugman");
import path = require("path");
import util = require("util");
import os = require("os");
import validUrl = require("valid-url");
import Future = require("fibers/future");
import temp = require("temp");
import PluginsServiceBaseLib = require("./plugins-service-base");

export class CordovaPluginsService extends PluginsServiceBaseLib.PluginsServiceBase {
	constructor(private $cordovaMigrationService: ICordovaMigrationService,
		private $project: Project.IProject,
		private $fs: IFileSystem,
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
			var pluginDir = this.getPluginsDir().wait();

			try {
				if (this.$fs.exists(pluginId).wait() && this.$fs.getFsStats(pluginId).wait().isFile()) {
					pluginId = this.resolveLocalPluginDir(pluginId).wait();
				}

				plugman.fetch(pluginId, pluginDir, false, ".", "HEAD", (result) => {
					if (this.isError(result)) {
						future.throw(result);
					} else {
						future.return(util.format("The plugin has been successfully fetched to %s", result));
					}
				});
			} catch(e) {
				future.throw(e);
			}
			return future.wait();
		}).future<string>()();
	}

	private resolveLocalPluginDir(pluginId: string): IFuture<string> {
		return (() => {
			temp.track();
			var destDir = temp.mkdirSync("ab-");
			this.$fs.unzip(pluginId, destDir).wait();

			var pluginXml = path.join(destDir, "plugin.xml");
			if (this.$fs.exists(pluginXml).wait()) {
				return destDir;
			}

			var archiveName = path.basename(pluginId, path.extname(pluginId));
			destDir = path.join(destDir, archiveName);
			pluginXml = path.join(destDir, "plugin.xml");
			if (this.$fs.exists(pluginXml).wait()) {
				return destDir;
			}

			throw new Error(util.format("The specified archive file '%s' does not contain valid Cordova plugin." +
				" It must contain plugin.xml in the root or in a directory with the name of the archive.", pluginId));
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
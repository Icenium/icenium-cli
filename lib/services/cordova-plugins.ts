///<reference path="../.d.ts"/>
"use strict";

import plugman = require("plugman");
import path = require("path");
import util = require("util");
import os = require("os");
import validUrl = require("valid-url");
import Future = require("fibers/future");
import temp = require("temp");
import PluginsDataLib = require("./../plugins-data");

export class CordovaPluginsService implements ICordovaPluginsService {
	private availablePlugins: IPlugin[];

	constructor(private $cordovaMigrationService: ICordovaMigrationService,
		private $project: Project.IProject,
		private $fs: IFileSystem,
		private $config: IConfiguration) {
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

			var dirs = _.filter(
				this.$fs.readDirectory(destDir).wait(),
				(item) => this.$fs.getFsStats(path.join(destDir, item)).wait().isDirectory());

			if (dirs.length === 1) {
				destDir = path.join(destDir, dirs[0]);
				pluginXml = path.join(destDir, "plugin.xml");
				if (this.$fs.exists(pluginXml).wait()) {
					return destDir;
				}
			}

			throw new Error(util.format("The specified archive file '%s' does not contain valid Cordova plugin." +
				" It must contain plugin.xml in the root or in a single directory inside.", pluginId));
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
			var plugins = _.filter(this.$project.projectData.CorePlugins, (pluginName: string) => this.isCordovaPlugin(pluginName).wait());
			return this.getMappedPlugins(plugins);
		}).future<IPlugin[]>()();
	}

	public getAvailablePlugins(): IFuture<IPlugin[]> {
		return (() => {
			if(!this.availablePlugins) {
				var version = this.$project.projectData.FrameworkVersion;
				var plugins = this.$cordovaMigrationService.pluginsForVersion(version).wait();
				this.availablePlugins = this.getMappedPlugins(plugins);
			}

			return this.availablePlugins;
		}).future<IPlugin[]>()();
	}

	private getMappedPlugins(plugins: string[]): IPlugin[] {
		return _.map(plugins, pluginName => {
			var pluginType = this.getPluginTypeByName(pluginName);
			return new PluginsDataLib.CordovaPluginData(pluginName, pluginType);
		});
	}

	private isCordovaPlugin(pluginName: string): IFuture<boolean> {
		return (() => {
			pluginName = pluginName.toLowerCase();
			return _.any(this.getAvailablePlugins().wait(), p => p.name.toLowerCase() === pluginName);
		}).future<boolean>()();
	}

	private getPluginTypeByName(pluginName: string): PluginsDataLib.PluginType {
		var pluginType = PluginsDataLib.PluginType.AdvancedPlugin;
		if (pluginName.startsWith("org.apache.cordova")) {
			pluginType = PluginsDataLib.PluginType.CorePlugin;
		}

		return pluginType;
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
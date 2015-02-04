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
	constructor(private $project: Project.IProject,
		private $fs: IFileSystem,
		private $config: IConfiguration,
		private $server: Server.IServer,
		private $projectConstants: Project.IProjectConstants) {

		this.$project.ensureCordovaProject();
	}

	public getPlugins(keywords: string[]): IBasicPluginInformation[] {
		this.configure();
		return this.search(keywords);
	}

	public search(keywords: string[]): IBasicPluginInformation[] {
		var future = new Future<IBasicPluginInformation[]>();
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

	public getAvailablePlugins(): IFuture<Server.CordovaPluginData[]> {
		return this.$server.cordova.getPlugins(this.$project.projectData.FrameworkVersion);
	}

	public createPluginData(plugin: Server.CordovaPluginData): IFuture<IPlugin> {
		return (() => {
			return new PluginsDataLib.CordovaPluginData(plugin, this.getPluginTypeByIdentifier(plugin.Identifier), this.$project, this.$projectConstants);
		}).future<IPlugin>()();
	}

	private getPluginTypeByIdentifier(pluginIdentifier: string): PluginsDataLib.PluginType {
		var pluginType = PluginsDataLib.PluginType.AdvancedPlugin;
		if (pluginIdentifier.startsWith("org.apache.cordova")) {
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

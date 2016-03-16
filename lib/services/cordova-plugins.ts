///<reference path="../.d.ts"/>
"use strict";

import plugman = require("plugman");
import * as path from "path";
import * as util from "util";
import Future = require("fibers/future");
import temp = require("temp");
import PluginsDataLib = require("./../plugins-data");

export class CordovaPluginsService implements ICordovaPluginsService {
	constructor(private $project: Project.IProject,
		private $fs: IFileSystem,
		private $config: IConfiguration,
		private $server: Server.IServer,
		private $projectConstants: IProjectConstants,
		private $resources: IResourceLoader) { }

	public getPlugins(keywords: string[]): IBasicPluginInformation[] {
		this.configure();
		return this.search(keywords);
	}

	// HACK: Information for this plugin is never returned from the server, so keep it here.
	// TODO: Remove the LivePatch HACK when the server returns correct results.
	// HACK: Platforms should be Server.DevicePlatform.Android, etc. but this fails at runtime that Server is not defined.
	// 		 That's why the plugin type is declared as any insted of Server.CordovaPluginData
	private livePatchPlugin: any = {
		"Name": "Telerik AppManager LiveSync",
		"Identifier": "com.telerik.LivePatch",
		"Version": "1.0.0",
		"Description": "This plugin adds Telerik AppManager LiveSync functionality",
		"Url": "",
		"Assets": [],
		"Platforms": ["Android", "iOS", "WP8"],
		"Variables": [],
		"AndroidRequiredPermissions": ["android.permission.INTERNET"]
	};

	public search(keywords: string[]): IBasicPluginInformation[] {
		let future = new Future<IBasicPluginInformation[]>();
		plugman.search(keywords, (err: Error, result: any) => {
			if (err) {
				future.throw(err);
			} else {
				future.return(result);
			}
		});
		return future.wait();
	}

	public fetch(pluginId: string): IFuture<string> {
		return(() => {
			this.$project.ensureProject();
			let future = new Future<string>();
			let pluginDir = this.getPluginsDir().wait();

			try {
				if (this.$fs.exists(pluginId).wait() && this.$fs.getFsStats(pluginId).wait().isFile()) {
					pluginId = this.resolveLocalPluginDir(pluginId).wait();
				}
				plugman.fetch(pluginId, pluginDir, false, ".", "HEAD", (err: Error, result: any) => {
					if (err) {
						future.throw(err);
					} else {
						future.return("The plugin has been successfully fetched to " + result);
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
			let destDir = temp.mkdirSync("ab-");
			this.$fs.unzip(pluginId, destDir).wait();

			let pluginXml = path.join(destDir, "plugin.xml");
			if (this.$fs.exists(pluginXml).wait()) {
				return destDir;
			}

			let dirs = _.filter(
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
		let future = new Future();
		let params = ["set", "registry", this.$config.CORDOVA_PLUGINS_REGISTRY];
		plugman.config(params, (error: Error, result: any) => {
			if (error) {
				future.throw(result);
			} else {
				future.return(result);
			}
		});
		future.wait();
	}

	public getAvailablePlugins(): IFuture<Server.CordovaPluginData[]> {
		return ((): Server.CordovaPluginData[] => {
			this.$project.ensureCordovaProject();
			// TODO: Remove the LivePatch HACK when the server returns correct results. Also check the tests.
			return this.$server.cordova.getPlugins(this.$project.projectData.FrameworkVersion).wait().concat([this.livePatchPlugin]);
		}).future<Server.CordovaPluginData[]>()();
	}

	public createPluginData(plugin: IMarketplacePluginData): IPlugin[] {
		this.$project.ensureCordovaProject();
		return [new PluginsDataLib.CordovaPluginData(plugin, this.getPluginTypeByIdentifier(plugin.Identifier), this.$project, this.$projectConstants)];
	}

	private getPluginTypeByIdentifier(pluginIdentifier: string): PluginsDataLib.PluginType {
		let pluginType = PluginsDataLib.PluginType.AdvancedPlugin;
		let corePluginRegex = require(path.join(this.$resources.resolvePath("Cordova"), "cordova-migration-data.json")).corePluginRegex;
		let isCorePlugin = new RegExp(corePluginRegex).test(pluginIdentifier);
		if (isCorePlugin) {
			pluginType = PluginsDataLib.PluginType.CorePlugin;
		}

		return pluginType;
	}

	private getPluginsDir(): IFuture<string> {
		return(() => {
			return path.join(this.$project.getProjectDir().wait(), "plugins");
		}).future<string>()();
	}
}
$injector.register("cordovaPluginsService", CordovaPluginsService);

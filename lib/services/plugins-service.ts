///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import options = require("./../options");

export class PluginsService implements IPluginsService {
	private static MESSAGES = ["\nCore Plugins:", "\nAdvanced Plugins:", "\nMarketplace Plugins:"];

	constructor(private $cordovaPluginsService: IPluginsService,
		private $marketplacePluginsService: IPluginsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject) {
		this.$project.ensureProject();
	}

	public getInstalledPlugins(): IFuture<IPlugin[]> {
		return (() => {
			return _.union(this.$cordovaPluginsService.getInstalledPlugins().wait(), this.$marketplacePluginsService.getInstalledPlugins().wait());
		}).future<IPlugin[]>()();
	}

	public getAvailablePlugins(): IFuture<IPlugin[]> {
		return (() => {
			return _.union(this.$cordovaPluginsService.getAvailablePlugins().wait(), this.$marketplacePluginsService.getAvailablePlugins().wait());
		}).future<IPlugin[]>()();
	}

	public addPlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(this.isPluginInstalled(pluginName).wait()) {
				this.$errors.fail("Plugin %s already exists", pluginName);
			}

			var plugin = this.getPluginByName(pluginName).wait();
			this.$project.projectData.CorePlugins.push(plugin.toProjectDataRecord());
			this.$project.saveProject().wait();
			this.$logger.out("Plugin %s was successfully added", pluginName);
		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!this.isPluginInstalled(pluginName).wait()) {
			 	this.$errors.fail("Could not find plugin with name %s.", pluginName);
			}

			var plugin = this.getPluginByName(pluginName).wait();
			this.$project.projectData.CorePlugins = _.without(this.$project.projectData.CorePlugins, plugin.toProjectDataRecord());
			this.$project.saveProject().wait();
			this.$logger.out("Plugin %s was successfully removed", pluginName);
		}).future<void>()();
	}

	public printPlugins(plugins: IPlugin[]): void {
		var groups = _.groupBy(plugins, (plugin: IPlugin) => plugin.type);
		_.each(Object.keys(groups), (group: string) => {
			this.$logger.out(PluginsService.MESSAGES[group]);
			var currentPlugins = _.sortBy(groups[group], (plugin: IPlugin) => plugin.name);
			_.each(currentPlugins, (plugin: IPlugin) => {
				this.$logger.out(plugin.description);
			});
		});
	}

	private getPluginByName(pluginName: string): IFuture<IPlugin> {
		return (() => {
			var plugins = this.getAvailablePlugins().wait();
			var toLowerCasePluginName = pluginName.toLowerCase();
			if(!_.any(plugins, (plugin: IPlugin) => plugin.name.toLowerCase() === toLowerCasePluginName)) {
				this.$errors.fail("Invalid plugin name: %s", pluginName);
			}

			return _.find(plugins, (plugin) => plugin.name.toLowerCase() === toLowerCasePluginName);
		}).future<IPlugin>()();
	}

	private isPluginInstalled(pluginName: string): IFuture<boolean> {
		return (() => {
			pluginName = pluginName.toLowerCase();
			return _.any(this.getInstalledPlugins().wait(), (plugin) => plugin.name.toLowerCase() === pluginName);
		}).future<boolean>()();
	}
}
$injector.register("pluginsService", PluginsService);
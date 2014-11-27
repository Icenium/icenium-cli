///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import util = require("util");
import options = require("./../options");

export class PluginsService implements IPluginsService {
	private static MESSAGES = ["Core Plugins", "Advanced Plugins", "Marketplace Plugins"];
	private identifierToPlugin: IDictionary<IPlugin>;

	constructor($cordovaPluginsService: ICordovaPluginsService,
		$marketplacePluginsService: ICordovaPluginsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $prompter: IPrompter) {
		this.$project.ensureProject();

		this.$logger.info("Gathering information for plugins...");

		this.identifierToPlugin = Object.create(null);
		this.createPluginsData($cordovaPluginsService).wait();
		this.createPluginsData($marketplacePluginsService).wait();
	}

	public getInstalledPlugins(): IPlugin[] {
		return _.map(this.$project.projectData.CorePlugins, (pluginIdentifier: string) => this.identifierToPlugin[pluginIdentifier]);
	}

	public getAvailablePlugins(): IPlugin[] {
		return _.values(this.identifierToPlugin);
	}

	public addPlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			if(this.isPluginInstalled(pluginName)) {
				this.$errors.fail("Plugin %s is already installed", pluginName);
			}

			this.configurePlugin(pluginName).wait();
			this.$logger.out("Plugin %s was successfully added", pluginName);

		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified.");
			}

			if(!this.isPluginInstalled(pluginName)) {
			 	this.$errors.fail("Could not find plugin with name %s.", pluginName);
			}

			var plugin = this.getPluginByName(pluginName);
			var cordovaPluginVariables = this.$project.projectData.CordovaPluginVariables;

			_.each(plugin.variables, variableName => {
				delete cordovaPluginVariables[plugin.identifier][variableName];
			});

			if(cordovaPluginVariables && _.keys(cordovaPluginVariables[plugin.identifier]).length === 0) {
				delete cordovaPluginVariables[plugin.identifier];
			}

			this.$project.projectData.CorePlugins = _.without(this.$project.projectData.CorePlugins, plugin.toProjectDataRecord());
			this.$project.saveProject().wait();
			this.$logger.out("Plugin %s was successfully removed", pluginName);
		}).future<void>()();
	}

	public printPlugins(plugins: IPlugin[]): void {
		var groups = _.groupBy(plugins, (plugin: IPlugin) => plugin.type);
		var outputLines:string[] = [];

		_.each(Object.keys(groups), (group: string) => {
			outputLines.push(util.format("%s:%s======================", PluginsService.MESSAGES[+group], os.EOL));

			var sortedPlugins = _.sortBy(groups[group], (plugin: IPlugin) => plugin.name);
			_.each(sortedPlugins, (plugin: IPlugin) => {
				outputLines.push(plugin.pluginInformation.join(os.EOL));
			});
		});

		this.$logger.out(outputLines.join(os.EOL + os.EOL));
	}

	public isPluginInstalled(pluginName: string): boolean {
		pluginName = pluginName.toLowerCase();
		return _.any(this.getInstalledPlugins(), (plugin) => plugin.name.toLowerCase() === pluginName);
	}

	public configurePlugin(pluginName: string): IFuture<void> {
		return (() => {
			var plugin = this.getPluginByName(pluginName);
			var cordovaPluginVariables:any = this.$project.projectData.CordovaPluginVariables;

			var variables = plugin.variables;
			if(variables) {
				if(!cordovaPluginVariables[plugin.identifier]) {
					cordovaPluginVariables[plugin.identifier] = {};
				}

				_.each(variables, (variableName: string) => {
					var variableInformation = this.gatherVariableInformation(plugin, variableName).wait();
					cordovaPluginVariables[plugin.identifier][variableName] = variableInformation[variableName];
				});
			}

			this.$project.projectData.CorePlugins.push(plugin.toProjectDataRecord());
			this.$project.saveProject().wait();

		}).future<void>()();
	}

	private createPluginsData(pluginsService: ICordovaPluginsService): IFuture<void> {
		return (() => {
			var plugins = pluginsService.getAvailablePlugins().wait();
			_.each(plugins, (plugin: any) => {
				var pluginData = pluginsService.createPluginData(plugin).wait();
				this.identifierToPlugin[pluginData.toProjectDataRecord()] = pluginData;
			});
		}).future<void>()();
	}

	private gatherVariableInformation(plugin: IPlugin, variableName: string): IFuture<any> {
		return (() => {
			var schema: IPromptSchema = {
				properties: { }
			};
			schema["properties"][variableName] = {
				required: true,
				type: "string"
			};

			var pluginVariables = this.$project.projectData.CordovaPluginVariables[plugin.identifier]
			if(pluginVariables && pluginVariables[variableName]) {
				schema["properties"][variableName]["default"] = () => pluginVariables[variableName];
			}

			this.$prompter.start();
			return this.$prompter.get(schema).wait();
		}).future<any>()();

	}

	private getPluginByName(pluginName: string): IPlugin {
		var plugins = this.getAvailablePlugins();
		var toLowerCasePluginName = pluginName.toLowerCase();

		var plugin = _.find(plugins, (plugin) => plugin.name.toLowerCase() === toLowerCasePluginName);
		if(!plugin) {
			this.$errors.fail("Invalid plugin name: %s", pluginName);
		}

		return plugin;
	}
}
$injector.register("pluginsService", PluginsService);
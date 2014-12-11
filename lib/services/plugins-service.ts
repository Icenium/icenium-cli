///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import util = require("util");
import options = require("./../options");
import projectTypes = require("../project-types");

export class PluginsService implements IPluginsService {
	private static CORE_PLUGINS_PROPERTY_NAME = "CorePlugins";
	private static CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME = "CordovaPluginVariables";
	private static MESSAGES = ["Core Plugins", "Advanced Plugins", "Marketplace Plugins"];

	private identifierToPlugin: IDictionary<IPlugin>;

	constructor($cordovaPluginsService: ICordovaPluginsService,
		$marketplacePluginsService: ICordovaPluginsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $prompter: IPrompter) {

		this.$project.ensureProject();

		// Cordova plugin commands are only applicable to Cordova projects
		if (this.$project.projectData.Framework !== projectTypes[projectTypes.Cordova]) {
			this.$errors.fail("This operation is not applicable to your project type.");
		}

		this.$logger.info("Gathering information for plugins...");

		this.identifierToPlugin = Object.create(null);
		this.createPluginsData($cordovaPluginsService).wait();
		this.createPluginsData($marketplacePluginsService).wait();
	}

	public getInstalledPlugins(): IPlugin[] {
		var corePlugins: any = null;
		if(options.debug || options.d) {
			corePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "debug");
		} else if(options.release || options.r) {
			corePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "release");
		} else {
			corePlugins = _.intersection(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "debug"), this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "release"));
		}

		return _.map(corePlugins, (pluginIdentifier: string) => this.identifierToPlugin[pluginIdentifier]);
	}

	// return plugins that are enabled in one or more configurations
	public getInstalledPluginsEnabledAtLeastInOneConfiguration(): IPlugin[] {
		var corePlugins: any = null;
		if(options.debug || options.d) {
			corePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "debug");
		} else if(options.release || options.r) {
			corePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "release");
		} else {
			corePlugins = _.union(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "debug"), this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, "release"));
		}

		return _.map(corePlugins, (pluginIdentifier: string) => this.identifierToPlugin[pluginIdentifier]);
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

		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified.");
			}

			if (!this.isPluginInstalled(pluginName)) {
				this.$errors.fail("Could not find plugin with name %s.", pluginName);
			}

			var plugin = this.getPluginByName(pluginName);

			if(this.$project.hasBuildConfigurations()) {
				_.each(plugin.configurations, (configuration:string) => {
					this.removePluginCore(pluginName, plugin, configuration).wait();
				});
			} else {
				this.removePluginCore(pluginName, plugin).wait();
			}
		}).future<void>()();
	}

	public printPlugins(plugins: IPlugin[]): void {
		var groups = _.groupBy(plugins, (plugin: IPlugin) => plugin.type);
		var outputLines:string[] = [];

		_.each(Object.keys(groups), (group: string) => {
			outputLines.push(util.format("%s:%s======================", PluginsService.MESSAGES[+group], os.EOL));

			var sortedPlugins = _.sortBy(groups[group], (plugin: IPlugin) => plugin.data.Name);
			_.each(sortedPlugins, (plugin: IPlugin) => {
				outputLines.push(plugin.pluginInformation.join(os.EOL));
			});
		});

		this.$logger.out(outputLines.join(os.EOL + os.EOL));
	}

	public isPluginInstalled(pluginName: string): boolean {
		pluginName = pluginName.toLowerCase();
		return _.any(this.getInstalledPlugins(), (plugin: IPlugin) => plugin.data.Name.toLowerCase() === pluginName);
	}

	public configurePlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(this.$project.hasBuildConfigurations()) {
				var configurations = this.$project.configurations;
				_.each(configurations, (configuration:string) => {
					this.configurePluginCore(pluginName, configuration).wait();
				});
			} else {
				this.configurePluginCore(pluginName).wait();
			}
		}).future<void>()();
	}

	private configurePluginCore(pluginName: string, configuration?: string): IFuture<void> {
		return (() => {
			var plugin = this.getPluginByName(pluginName);
			var pluginData = plugin.data;
			var cordovaPluginVariables = this.$project.getProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration) || {};

			var variables = pluginData.Variables;
			if(variables) {
				if(!cordovaPluginVariables[pluginData.Identifier]) {
					cordovaPluginVariables[pluginData.Identifier] = {};
				}

				_.each(variables, (variableName: string) => {
					var variableInformation = this.gatherVariableInformation(pluginData, variableName, configuration).wait();
					cordovaPluginVariables[pluginData.Identifier][variableName] = variableInformation[variableName];
				});
				this.$project.setProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, cordovaPluginVariables, configuration);
			}

			var newCorePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration);
			newCorePlugins.push(plugin.toProjectDataRecord());
			this.$project.setProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, configuration);
			this.$project.saveProject().wait();

			if(configuration) {
				this.$logger.out("Plugin %s was successfully added for %s configuration.", pluginName, configuration);
			} else {
				this.$logger.out("Plugin %s was successfully added.", pluginName);
			}

		}).future<void>()();
	}

	private removePluginCore(pluginName: string, plugin: IPlugin, configuration?: string): IFuture<void> {
		return (() => {
			var pluginData = plugin.data;
			var cordovaPluginVariables = this.$project.getProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration);

			_.each(pluginData.Variables, variableName => {
				delete cordovaPluginVariables[pluginData.Identifier][variableName];
			});

			if (cordovaPluginVariables && _.keys(cordovaPluginVariables[pluginData.Identifier]).length === 0) {
				delete cordovaPluginVariables[pluginData.Identifier];
			}

			var newCorePlugins = _.without(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration), plugin.toProjectDataRecord());
			this.$project.setProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, configuration);
			this.$project.saveProject().wait();

			if(configuration) {
				this.$logger.out("Plugin %s was successfully removed for %s configuration.", pluginName, configuration);
			} else {
				this.$logger.out("Plugin %s was successfully removed.", pluginName);
			}

		}).future<void>()();
	}

	private createPluginsData(pluginsService: ICordovaPluginsService): IFuture<void> {
		return (() => {
			var plugins = pluginsService.getAvailablePlugins().wait();

			_.each(plugins, (plugin: Server.CordovaPluginData) => {

				try {
					var pluginData = pluginsService.createPluginData(plugin).wait();
				} catch(e) {
					this.$logger.warn("Unable to fetch data for %s plugin. Please, try again in a few minutes.", (<any>plugin).title);
					this.$logger.trace(e);
				}

				if(pluginData) {
					var projectDataRecord = pluginData.toProjectDataRecord();
					var configurations = _.keys(this.$project.configurationSpecificData);

					_.each(configurations, (configuration:string) => {
						var configData = this.$project.configurationSpecificData[configuration];
						if (configData) {
							var corePlugins = configData[PluginsService.CORE_PLUGINS_PROPERTY_NAME];
							if (corePlugins && _.contains(corePlugins, projectDataRecord)) {
								pluginData.configurations.push(configuration);
							}
						}
					});

					this.identifierToPlugin[projectDataRecord] = pluginData;
				}
			});
		}).future<void>()();
	}

	private gatherVariableInformation(plugin: Server.CordovaPluginData, variableName: string, configuration: string): IFuture<any> {
		return (() => {
			var schema: IPromptSchema = {
				properties: { }
			};
			schema["properties"][variableName] = {
				required: true,
				type: "string",
				description: configuration ? util.format("Set value for variable %s in %s configuration", variableName, configuration) : util.format("Set value for variable %s", variableName)
			};

			var cordovaPluginVariables = this.$project.getProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration) || {};
			var pluginVariables = cordovaPluginVariables[plugin.Identifier];
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

		var plugin = _.find(plugins, (plugin: IPlugin) => plugin.data.Name.toLowerCase() === toLowerCasePluginName);
		if(!plugin) {
			this.$errors.fail("Invalid plugin name: %s", pluginName);
		}

		return plugin;
	}
}
$injector.register("pluginsService", PluginsService);
///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import util = require("util");
import options = require("../common/options");
import pluginsDataLib = require("../plugins-data");
import Future = require("fibers/future");

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
		private $prompter: IPrompter,
		private $loginManager: ILoginManager,
		private $projectConstants: Project.IProjectConstants) {

		// Cordova plugin commands are only applicable to Cordova projects
		this.$project.ensureCordovaProject();
		this.$loginManager.ensureLoggedIn().wait();
		this.identifierToPlugin = Object.create(null);
		Future.wait([this.createPluginsData($cordovaPluginsService),
			this.createPluginsData($marketplacePluginsService)]);
	}

	public getInstalledPlugins(): IPlugin[] {
		let corePlugins: string[] = [];
		if(options.debug) {
			corePlugins = corePlugins.concat(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, this.$projectConstants.DEBUG_CONFIGURATION_NAME));
		}

		if(options.release) {
			corePlugins = corePlugins.concat(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, this.$projectConstants.RELEASE_CONFIGURATION_NAME));
		}

		if(!options.debug && !options.release) {
			corePlugins = <string[]>_.union(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, this.$projectConstants.DEBUG_CONFIGURATION_NAME), this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, this.$projectConstants.RELEASE_CONFIGURATION_NAME));
		}

		return _.map(corePlugins,(pluginIdentifier: string) => this.identifierToPlugin[pluginIdentifier]);
	}

	public getAvailablePlugins(): IPlugin[] {
		return _.values(this.identifierToPlugin);
	}

	public addPlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			let parts = pluginName.split("@");
			pluginName = parts[0];
			let version = parts[1];

			let pluginNameToLowerCase = pluginName.toLowerCase();
			if(!_.any(this.getAvailablePlugins(), (pl) => pl.data.Name.toLowerCase() ===  pluginNameToLowerCase || pl.data.Identifier.toLowerCase() === pluginNameToLowerCase)) {
				this.$errors.failWithoutHelp("Invalid plugin name: %s", pluginName);
			}

			let installedPlugin = this.getInstalledPluginByName(pluginName);

			if(installedPlugin) {
				if(installedPlugin.type === pluginsDataLib.PluginType.MarketplacePlugin) {
					let message = util.format("Would you like to change the version of '%s' plugin. The current installed version is %s. ", pluginName, installedPlugin.data.Version);
					let confirm = version ? true : this.$prompter.confirm(message, () => true).wait();
					if (confirm) {
						let versions = this.getPluginVersions(pluginName);

						if(version) {
							if(!_.any(versions, v => v.value === version)) {
								this.$errors.fail("Invalid version %s. The valid versions are: %s.", version, versions.map(v => v.value).join(", "));
							} else if(installedPlugin.data.Version === version) {
								this.$logger.info("Plugin '%s' with version '%s' is already installed.", pluginName, version);
								return;
							}
						} else {
							let currentVersionIndex = _.findIndex(versions, (v) => v.value === installedPlugin.data.Version);
							versions.splice(currentVersionIndex, 1);
							version = this.promptForVersion(pluginName, versions).wait();
						}

						this.$logger.info("Updating plugin '%s' to version %s.", pluginName, version);

						let updatePlugin = (pluginName:string, configuration?:string) => {
							let newCorePlugins = _.without(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration), installedPlugin.toProjectDataRecord());
							newCorePlugins.push(util.format("%s@%s", installedPlugin.data.Identifier, version));
							this.$project.setProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, configuration);
							this.$project.saveProject().wait();
						};
						if (this.$project.hasBuildConfigurations()) {
							let configurations = this.$project.configurations;
							_.each(configurations, (configuration:string) => {
								updatePlugin(pluginName, configuration);
							});
						} else {
							updatePlugin(pluginName);
						}

						this.$logger.info("Successfully updated plugin '%s' to version %s.", pluginName, version);
					}
					return;
				} else {
					this.$errors.fail("Plugin '%s' is already installed", pluginName);
				}
			}

			let pluginToAdd = this.getPluginByName(pluginName);
			if(pluginToAdd.type === pluginsDataLib.PluginType.MarketplacePlugin) {
				let versions = this.getPluginVersions(pluginName);
				if(version && !_.any(versions, v => v.value === version)) {
					this.$errors.fail("Invalid version %s. The valid versions are: %s", version, versions.map(v => v.value).join(", "));
				} else if(!version) {
					version = this.promptForVersion(pluginName, versions).wait();
				}
			}

			this.configurePlugin(pluginName, version).wait();

		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified.");
			}

			let installedPlugin = this.getInstalledPluginByName(pluginName);
			if (installedPlugin === null || installedPlugin === undefined) {
				this.$errors.fail("Could not find plugin with name %s.", pluginName);
			}


			let plugin = this.getPluginByName(pluginName, installedPlugin.data.Version);

			if(this.$project.hasBuildConfigurations()) {
				let configurations = this.$project.configurations;
				_.each(configurations, (configuration:string) => {
					this.removePluginCore(pluginName, plugin, configuration).wait();
				});
			} else {
				this.removePluginCore(pluginName, plugin).wait();
			}
		}).future<void>()();
	}

	public printPlugins(plugins: IPlugin[]): void {
		if(options.available) {
			// Group marketplace plugins
			let marketplacePlugins = _.filter(plugins, (pl) => pl.type === pluginsDataLib.PluginType.MarketplacePlugin);
			let output = _.filter(plugins, pl => pl.type === pluginsDataLib.PluginType.CorePlugin || pl.type === pluginsDataLib.PluginType.AdvancedPlugin);

			let groups = _.groupBy(marketplacePlugins, (plugin:IPlugin) => plugin.data.Identifier);
			_.each(groups, (group:any) => {
				let defaultData = _.find(group, (gr:IPlugin) => {
					let pvd = (<any>gr).pluginVersionsData;
					return pvd && gr.data.Version === pvd.DefaultVersion;
				});
				if (defaultData) {
					output.push(defaultData);
				}
			});

			this.printPluginsCore(output);
		} else {
			this.printPluginsCore(plugins);
		}
	}

	public isPluginInstalled(pluginName: string): boolean {
		let installedPlugin = this.getInstalledPluginByName(pluginName);
		return installedPlugin !== null && installedPlugin !== undefined;
	}

	public configurePlugin(pluginName: string, version: string): IFuture<void> {
		return (() => {
			if(this.$project.hasBuildConfigurations()) {
				let configurations = this.$project.configurations;
				_.each(configurations, (configuration:string) => {
					this.configurePluginCore(pluginName, configuration, version).wait();
				});
			} else {
				this.configurePluginCore(pluginName, version).wait();
			}
		}).future<void>()();
	}

	private getInstalledPluginByName(pluginName: string): IPlugin {
		pluginName = pluginName.toLowerCase();
		let installedPlugins = this.getInstalledPlugins();
		return _.find(installedPlugins, (plugin: IPlugin) => plugin.data.Name.toLowerCase() === pluginName || plugin.data.Identifier.toLowerCase() === pluginName);
	}

	private configurePluginCore(pluginName: string, configuration?: string, version?: string): IFuture<void> {
		return (() => {
			let plugin = this.getPluginByName(pluginName);
			let pluginData = plugin.data;
			let cordovaPluginVariables = this.$project.getProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration) || {};

			let variables = pluginData.Variables;
			if(variables && variables.length > 0) {
				if(!cordovaPluginVariables[pluginData.Identifier]) {
					cordovaPluginVariables[pluginData.Identifier] = {};
				}

				_.each(variables, (variableName: string) => {
					let variableInformation = this.gatherVariableInformation(pluginData, variableName, configuration).wait();
					cordovaPluginVariables[pluginData.Identifier][variableName] = variableInformation[variableName];
				});
				this.$project.setProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, cordovaPluginVariables, configuration);
			}

			let newCorePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration);
			if(!newCorePlugins) {
				newCorePlugins = [];
			}
			newCorePlugins.push(plugin.toProjectDataRecord(version));
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
			let pluginData = plugin.data;
			let cordovaPluginVariables = this.$project.getProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration);

			_.each(pluginData.Variables, variableName => {
				delete cordovaPluginVariables[pluginData.Identifier][variableName];
			});

			if (cordovaPluginVariables && _.keys(cordovaPluginVariables[pluginData.Identifier]).length === 0) {
				delete cordovaPluginVariables[pluginData.Identifier];
			}
			let oldCorePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration);
			let newCorePlugins = _.without(oldCorePlugins, plugin.toProjectDataRecord());

			if(newCorePlugins.length !== oldCorePlugins.length) {
				this.$project.setProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, configuration);
				this.$project.saveProject().wait();

				if(configuration) {
					this.$logger.out("Plugin %s was successfully removed for %s configuration.", pluginName, configuration);
				} else {
					this.$logger.out("Plugin %s was successfully removed.", pluginName);
				}
			}
		}).future<void>()();
	}

	private createPluginsData(pluginsService: ICordovaPluginsService): IFuture<void> {
		return (() => {
			let plugins = pluginsService.getAvailablePlugins().wait();
			_.each(plugins, (plugin: Server.CordovaPluginData) => {
				try {
					let data = pluginsService.createPluginData(plugin);
					_.each(data, pluginData => {
						if (pluginData && pluginData.data) {
							let projectDataRecord = pluginData.toProjectDataRecord();
							let configurations = this.$project.configurationSpecificData;

							_.each(configurations, (configData: IDictionary<any>, configuration:string) => {
								if (configData) {
									let corePlugins = configData[PluginsService.CORE_PLUGINS_PROPERTY_NAME];
									if (corePlugins && _.contains(corePlugins, projectDataRecord)) {
										pluginData.configurations.push(configuration);
									}
								}
							});

							this.identifierToPlugin[projectDataRecord] = pluginData;
						} else {
							this.$logger.warn("Unable to fetch data for plugin %s.", plugin.Identifier);
						}
					});
				} catch (e) {
					this.$logger.warn("Unable to fetch data for %s plugin. Please, try again in a few minutes.", (<any>plugin).title);
					this.$logger.trace(e);
				}
			});
		}).future<void>()();
	}

	private gatherVariableInformation(plugin: Server.CordovaPluginData, variableName: string, configuration: string): IFuture<any> {
		return (() => {
			let schema: IPromptSchema = {
				name: variableName,
				type: "input",
				message: configuration ? util.format("Set value for variable %s in %s configuration", variableName, configuration) : util.format("Set value for variable %s", variableName)
			};

			let cordovaPluginVariables = this.$project.getProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration) || {};
			let pluginVariables = cordovaPluginVariables[plugin.Identifier];
			if(pluginVariables && pluginVariables[variableName]) {
				schema["default"] = () => pluginVariables[variableName];
			}

			return this.$prompter.get([schema]).wait();
		}).future<any>()();
	}

	private getPluginByName(pluginName: string, version?: string): IPlugin {
		let plugins = this.getAvailablePlugins();
		let toLowerCasePluginName = pluginName.toLowerCase();

		let plugin = _.find(plugins, (plugin: IPlugin) => {
			let condition = plugin.data.Name.toLowerCase() === toLowerCasePluginName || plugin.data.Identifier.toLowerCase() === toLowerCasePluginName;
			if(version) {
				condition = condition && plugin.data.Version === version;
			}

			return condition;
		});
		if(!plugin) {
			this.$errors.fail("Invalid plugin name: %s", pluginName);
		}

		return plugin;
	}

	private getPluginVersions(pluginName: string): any[] {
		let toLowerCasePluginName = pluginName.toLowerCase();

		let versions:any[] = [];
		_.each(this.getAvailablePlugins(), (plugin:IPlugin) => {
			if (plugin.data.Name.toLowerCase() === toLowerCasePluginName || plugin.data.Identifier.toLowerCase() === toLowerCasePluginName) {
				let pluginVersionsData = (<IMarketplacePlugin>plugin).pluginVersionsData;
				versions = _.map(pluginVersionsData.Versions, p => {
					return {name: p.Version, value: p.Version};
				});
				return false;
			}
		});

		return versions;
	}

	private promptForVersion(pluginName: string, versions: any[]): IFuture<string> {
		return (() => {
			return versions.length > 1 ? this.promptForVersionCore(pluginName, versions).wait(): versions[0].value;
		}).future<string>()();
	}

	private promptForVersionCore(pluginName: string, versions: any[]): IFuture<string> {
		return (() => {
			let version = this.$prompter.promptForChoice("Which plugin version do you want to use?", versions).wait();
			return version;
		}).future<string>()();
	}

	private printPluginsCore(plugins: IPlugin[]): void {
		let groups = _.groupBy(plugins, (plugin: IPlugin) => plugin.type);
		let outputLines:string[] = [];

		_.each(Object.keys(groups), (group: string) => {
			outputLines.push(util.format("%s:%s======================", PluginsService.MESSAGES[+group], os.EOL));

			let sortedPlugins = _.sortBy(groups[group], (plugin: IPlugin) => plugin.data.Name);
			_.each(sortedPlugins, (plugin: IPlugin) => {
				outputLines.push(plugin.pluginInformation.join(os.EOL));
			});
		});

		this.$logger.out(outputLines.join(os.EOL + os.EOL));
	}
}
$injector.register("pluginsService", PluginsService);

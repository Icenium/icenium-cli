///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import util = require("util");
import pluginsDataLib = require("../plugins-data");
import Future = require("fibers/future");
import helpers = require("../common/helpers");
import semver = require("semver");

export class PluginsService implements IPluginsService {
	private static CORE_PLUGINS_PROPERTY_NAME = "CorePlugins";
	private static CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME = "CordovaPluginVariables";
	private static MESSAGES = ["Core Plugins", "Advanced Plugins", "Marketplace Plugins"];
	private _identifierToPlugin: IDictionary<IPlugin>;
	private get identifierToPlugin(): IDictionary<IPlugin> {
		if (!this._identifierToPlugin) {
			this.loadPluginsData().wait();	
		}

		return this._identifierToPlugin;
	}
	
	private pluginsForbiddenConfigurations: IStringDictionary = {
		"com.telerik.LivePatch": this.$projectConstants.DEBUG_CONFIGURATION_NAME
	}

	constructor(private $cordovaPluginsService: ICordovaPluginsService,
		private $marketplacePluginsService: ICordovaPluginsService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $prompter: IPrompter,
		private $loginManager: ILoginManager,
		private $projectConstants: Project.IProjectConstants,
		private $options: IOptions) { }

	private loadPluginsData(): IFuture<void> {
		return (() => {
			// Cordova plugin commands are only applicable to Cordova projects
			this.$project.ensureCordovaProject();
			this.$loginManager.ensureLoggedIn().wait();
			this._identifierToPlugin = Object.create(null);
			Future.wait([this.createPluginsData(this.$cordovaPluginsService),
				this.createPluginsData(this.$marketplacePluginsService)]);
		}).future<void>()();
	}

	public getInstalledPlugins(): IPlugin[] {
		let corePlugins: IPlugin[] = [];
		if(this.$options.debug) {
			corePlugins = corePlugins.concat(this.getInstalledPluginsForConfiguration(this.$projectConstants.DEBUG_CONFIGURATION_NAME));
		}

		if(this.$options.release) {
			corePlugins = corePlugins.concat(this.getInstalledPluginsForConfiguration(this.$projectConstants.RELEASE_CONFIGURATION_NAME));
		}

		if(!this.$options.debug && !this.$options.release) {
			corePlugins = this.getInstalledPluginsForConfiguration();
		}

		return corePlugins;
	}

	private getInstalledPluginsForConfiguration(config?: string): IPlugin[] {
		let corePlugins: string[] = [];
		if(config) {
			corePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, config);
		} else {
			corePlugins = <string[]>_.union(this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, this.$projectConstants.DEBUG_CONFIGURATION_NAME), this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, this.$projectConstants.RELEASE_CONFIGURATION_NAME));
		}

		return _.map(corePlugins, pluginIdentifier => {
			let plugin = this.identifierToPlugin[pluginIdentifier];
			if (!plugin) {
				let failMessage = config ?
					`You have enabled an invalid plugin: ${pluginIdentifier} for the ${config} build configuration. Check your .${config}.abproject file in the project root and correct or remove the invalid plugin entry.` :
					`You have enabled an invalid plugin: ${pluginIdentifier}. Check your ${this.$projectConstants.DEBUG_PROJECT_FILE_NAME} and ${this.$projectConstants.RELEASE_PROJECT_FILE_NAME} files in the project root and correct or remove the invalid plugin entry.`;
				this.$errors.failWithoutHelp(failMessage);
			}

			return plugin;
		});
	}

	public getAvailablePlugins(): IPlugin[] {
		let plugins = _.values(this.identifierToPlugin);
		if(this.$project.projectData) {
			plugins = _.filter(plugins, pl => this.isPluginSupported(pl, this.$project.projectData.FrameworkVersion));
		}
		return plugins;
	}

	private get configurations(): string[]{
		return [this.$projectConstants.DEBUG_CONFIGURATION_NAME, this.$projectConstants.RELEASE_CONFIGURATION_NAME];
	}

	public addPlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			let pluginBasicInfo = this.getPluginBasicInformation(pluginName);
			pluginName = pluginBasicInfo.name;
			let version = pluginBasicInfo.version;

			let pluginNameToLowerCase = pluginName.toLowerCase();
			if(!_.any(this.getAvailablePlugins(),(pl) => pl.data.Name.toLowerCase() === pluginNameToLowerCase || pl.data.Identifier.toLowerCase() === pluginNameToLowerCase)) {
				this.$errors.failWithoutHelp("Invalid plugin name: %s", pluginName);
			}
			let installedPluginsForConfiguration = this.getInstalledPluginsForConfiguration(); 
			let installedPluginInstances = installedPluginsForConfiguration
				.filter(pl => pl.data.Name.toLowerCase() === pluginNameToLowerCase || pl.data.Identifier.toLowerCase() === pluginNameToLowerCase);
			let pluginIdFromName = this.getPluginIdFromName(pluginName).toLowerCase();
			if(!installedPluginInstances.length && pluginIdFromName) {
				this.$logger.trace(`Unable to find installed plugin with specified name: '${pluginName}'. Trying to find if this is an old name of installed plugin.`)
				installedPluginInstances = installedPluginsForConfiguration.filter(pl => pl.data.Identifier.toLowerCase() === pluginIdFromName);
			}

			if(installedPluginInstances && installedPluginInstances.length > 0) {
				let installedPluginsType = _.chain(installedPluginInstances).groupBy((pl: IPlugin) => pl.type).keys().value();
				if(installedPluginsType.length > 1) {
					// We should NEVER get here. CorePlugins and Marketplace plugins cannot have duplicate identifiers.
					this.$errors.failWithoutHelp("There are several plugins with name '%s' and they have different types: '%s'", pluginName, installedPluginsType.join(", "));
				} else if(installedPluginsType.length === 1) {
					if(installedPluginsType[0].toString() === pluginsDataLib.PluginType.MarketplacePlugin.toString()) {
						return this.modifyInstalledMarketplacePlugin(installedPluginInstances[0].data.Identifier, version).wait();
					} else {
						// Check if plugin is installed for current configuration.
						let installedPlugin = this.getInstalledPluginByName(pluginName);
						if(installedPlugin) {
							this.$logger.info("Plugin '%s' is already installed", pluginName);
							return;
						}
					}
				}
			}

			let pluginToAdd = this.getPluginByName(pluginName);
			if(pluginToAdd.type === pluginsDataLib.PluginType.MarketplacePlugin) {
				version = this.selectPluginVersion(version, pluginToAdd).wait();
				if(!this.isPluginSupported(pluginToAdd, this.$project.projectData.FrameworkVersion, version)) {
					this.$errors.failWithoutHelp(`Plugin ${pluginName} is not avaialble for framework version '${this.$project.projectData.FrameworkVersion}'.`);
				}
			}

			let configurations = this.$project.configurations;
			if(_(this.pluginsForbiddenConfigurations).keys().find(key => key === pluginToAdd.data.Identifier)) {
				let forbiddenConfig = this.pluginsForbiddenConfigurations[pluginToAdd.data.Identifier];
				if(this.$project.configurations.length === 1 && _.contains(this.$project.configurations, forbiddenConfig)) {
					this.$errors.failWithoutHelp(`You cannot enable plugin ${pluginName} in ${forbiddenConfig} configuration.`);
				}
				configurations = _.without(this.$project.configurations, forbiddenConfig);
			}
			
			this.configurePlugin(pluginName, version, configurations).wait();
		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified.");
			}

			let installedPlugins = this.getInstalledPluginByName(pluginName);
			let plugin = installedPlugins[0];
			if(!plugin) {
				this.$errors.fail("Could not find plugin with name %s.", pluginName);
			}

			if(this.$project.hasBuildConfigurations()) {
				let configurations = this.$project.configurations;
				_.each(configurations,(configuration: string) => {
					this.removePluginCore(pluginName, plugin, configuration).wait();
				});
			} else {
				this.removePluginCore(pluginName, plugin).wait();
			}
		}).future<void>()();
	}

	public printPlugins(plugins: IPlugin[]): void {
		if(this.$options.available) {
			// Group marketplace plugins
			let marketplacePlugins = _.filter(plugins,(pl) => pl.type === pluginsDataLib.PluginType.MarketplacePlugin);
			let output = _.filter(plugins, pl => pl.type === pluginsDataLib.PluginType.CorePlugin || pl.type === pluginsDataLib.PluginType.AdvancedPlugin);

			let groups = _.groupBy(marketplacePlugins,(plugin: IPlugin) => plugin.data.Identifier);
			_.each(groups,(group: any) => {
				let defaultData = _.find(group,(gr: IPlugin) => {
					let pvd = (<any>gr).pluginVersionsData;
					return pvd && gr.data.Version === pvd.DefaultVersion;
				});
				if(defaultData) {
					output.push(defaultData);
				}
			});

			this.printPluginsCore(output);
		} else {
			this.printPluginsCore(plugins);
		}
	}

	public isPluginInstalled(pluginName: string): boolean {
		let installedPluginInstances = this.getInstalledPluginByName(pluginName);
		return installedPluginInstances && installedPluginInstances.length > 0;
	}

	public configurePlugin(pluginName: string, version: string, configurations?: string[]): IFuture<void> {
		return (() => {
			if(this.$project.hasBuildConfigurations()) {
				let configs = configurations || this.$project.configurations;
				_.each(configs,(configuration: string) => {
					this.configurePluginCore(pluginName, configuration, version).wait();
				});
			} else {
				this.configurePluginCore(pluginName, version).wait();
			}
		}).future<void>()();
	}

	public getPluginBasicInformation(pluginName: string): IBasicPluginInformation {
		let [ name, version ] = pluginName.split("@");
		return { name, version };
	}

	private isPluginSupported(plugin: IPlugin, frameworkVersion: string, pluginVersion?: string): boolean {
		if(!this.isMarketplacePlugin(plugin)) {
			return true;
		}

		pluginVersion = pluginVersion || plugin.data.Version;
		let pluginVersions = this.getPluginVersions(plugin);
		let version = _.find(pluginVersions, v => v.value === pluginVersion);
		return version && semver.satisfies(frameworkVersion, version.cordovaVersionRange);
	}

	private getInstalledPluginByName(pluginName: string): IPlugin[] {
		pluginName = pluginName.toLowerCase();
		let installedPlugins = this.getInstalledPlugins();
		let installedPluginInstances =  _.filter(installedPlugins,(plugin: IPlugin) => plugin.data.Name.toLowerCase() === pluginName || plugin.data.Identifier.toLowerCase() === pluginName);
		let pluginIdFromName = this.getPluginIdFromName(pluginName).toLowerCase();
		if(!installedPluginInstances.length && pluginIdFromName) {
			this.$logger.trace(`Unable to find installed plugin with specified name: '${pluginName}'. Trying to find if this is an old name of installed plugin.`)
			installedPluginInstances = installedPlugins.filter(pl => pl.data.Identifier.toLowerCase() === pluginIdFromName);
		}

		return installedPluginInstances;
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

			let newCorePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration) || [];
			// remove all instances of the plugin from current configuration
			let lowerCasePluginIdentifier = plugin.data.Identifier.toLowerCase();
			let installedPlugin = this.getInstalledPluginsForConfiguration(configuration).filter((pl: IPlugin) => pl.data.Identifier.toLowerCase() === lowerCasePluginIdentifier);

			_.each(installedPlugin, pl => newCorePlugins = _.without(newCorePlugins, pl.toProjectDataRecord(pl.data.Version)));

			newCorePlugins.push(plugin.toProjectDataRecord(version));
			this.$project.setProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, configuration);
			let versionString = this.isMarketplacePlugin(plugin) ? ` with version ${version}` : "";
			if(configuration) {
				this.$project.saveProject(this.$project.getProjectDir().wait(), [configuration]).wait();
				this.$logger.out(`Plugin ${pluginName} was successfully added for ${configuration} configuration${versionString}.`);
			} else {
				this.$project.saveProject().wait();
				this.$logger.out(`Plugin ${pluginName} was successfully added${versionString}.`);
			}
		}).future<void>()();
	}

	private removePluginCore(pluginName: string, plugin: IPlugin, configuration?: string): IFuture<void> {
		return (() => {
			let pluginData = plugin.data;
			let cordovaPluginVariables = this.$project.getProperty(PluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration);
			
			if (cordovaPluginVariables && _.keys(cordovaPluginVariables[pluginData.Identifier]).length > 0) {
				_.each(pluginData.Variables, variableName => {
					delete cordovaPluginVariables[pluginData.Identifier][variableName];
				});
			}

			if(cordovaPluginVariables && _.keys(cordovaPluginVariables[pluginData.Identifier]).length === 0) {
				delete cordovaPluginVariables[pluginData.Identifier];
			}
			let oldCorePlugins = this.$project.getProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration);
			let newCorePlugins = _.without(oldCorePlugins, plugin.toProjectDataRecord());
			if(newCorePlugins.length !== oldCorePlugins.length) {
				this.$project.setProperty(PluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, configuration);

				if(configuration) {
					this.$project.saveProject(this.$project.getProjectDir().wait(), [configuration]).wait();
					this.$logger.out("Plugin %s was successfully removed for %s configuration.", pluginName, configuration);
				} else {
					this.$project.saveProject().wait();
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

							this._identifierToPlugin[projectDataRecord] = pluginData;
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

	public getPluginVersions(plugin: IPlugin): IPluginVersion[] {
		let pluginVersionsData = (<IMarketplacePlugin>plugin).pluginVersionsData;
		return _.map(pluginVersionsData.Versions, p => {
			let pluginVersion: IPluginVersion = {
				name: p.Version,
				value: p.Version,
				cordovaVersionRange: p.SupportedVersion
			}

			return pluginVersion;
		});
	}

	private promptForVersion(pluginName: string, versions: any[]): IFuture<string> {
		return (() => {
			return versions.length > 1 ? this.promptForVersionCore(pluginName, versions).wait() : versions[0].value;
		}).future<string>()();
	}

	private promptForVersionCore(pluginName: string, versions: any[]): IFuture<string> {
		return (() => {
			let version: string;
			if(helpers.isInteractive()) {
				version = this.$prompter.promptForChoice("Which plugin version do you want to use?", versions).wait();
			} else {
				this.$errors.failWithoutHelp(`You must specify valid version in order to update your plugin when terminal is not interactive.`);
			}
			
			return version;
		}).future<string>()();
	}

	private printPluginsCore(plugins: IPlugin[]): void {
		let groups = _.groupBy(plugins, (plugin: IPlugin) => plugin.type);
		let outputLines:string[] = [];

		_.each(Object.keys(groups),(group: string) => {
			outputLines.push(util.format("%s:%s======================", PluginsService.MESSAGES[+group], os.EOL));

			let sortedPlugins = _.sortBy(groups[group], (plugin: IPlugin) => plugin.data.Name);
			_.each(sortedPlugins, (plugin: IPlugin) => {
				outputLines.push(plugin.pluginInformation.join(os.EOL));
			});
		});

		this.$logger.out(outputLines.join(os.EOL + os.EOL));
	}

	private modifyInstalledMarketplacePlugin(pluginName: string, version: string): IFuture<void> {
		return ((): void => {
			pluginName = pluginName.toLowerCase();
			let isConsoleInteractive = helpers.isInteractive();
			let allInstalledPlugins = this.getInstalledPluginsForConfiguration();
			let installedPluginInstances = _.filter(allInstalledPlugins,(plugin: IPlugin) => plugin.data.Name.toLowerCase() === pluginName || plugin.data.Identifier.toLowerCase() === pluginName);
			let selectedVersion: string;
			if(installedPluginInstances.length > 1) {
				this.$logger.warn(`Plugin '${pluginName}' is enabled with different versions in your project configurations. You must use the same version in all configurations.'`);
			}

			_.each(installedPluginInstances, (pl: IPlugin) => {
				let configString = pl.configurations.length > 1 ? `'${pl.configurations.join(", ")}' configurations` : `'${pl.configurations[0]}' configuration`;
				this.$logger.info(`Plugin '${pluginName}' is enabled in ${configString} with version '${pl.data.Version}'.`);
			});

			let installedPlugin = installedPluginInstances[0];
			// in case options.debug and options.release are not specified, let's just update both configurations without asking for prompt.
			if(this.$project.configurations.length > 1) {
				selectedVersion = this.selectPluginVersion(version, installedPlugin).wait();
				this.configurePlugin(pluginName, selectedVersion, this.configurations).wait();
				return;
			}

			// We'll get here in case there's only one configuration specified by user
			let selectedConfiguration = this.$project.configurations[0];
			let configurationToRemove = _(this.configurations)
										.filter(config => config !== selectedConfiguration)
										.first();
			let removeItemChoice = `Remove plugin from '${configurationToRemove}' configuration and add it to '${selectedConfiguration}' configuration only.`;
			let modifyBothConfigs = "Enable plugin in both configurations with same version.";
			let cancelOperation = "Cancel operation.";
			let choices = [removeItemChoice, modifyBothConfigs, cancelOperation];

			if(installedPluginInstances.length === 1 && installedPlugin.configurations.length === 1 && selectedConfiguration === installedPlugin.configurations[0]) {
				// in case one of the config is specified and plugin is enabled in this config only, just update the version
				selectedVersion = this.selectPluginVersion(version, installedPlugin, { excludeCurrentVersion: true }).wait();
				this.configurePluginCore(pluginName, selectedConfiguration, selectedVersion).wait();
				return;
			}

			if(isConsoleInteractive) {
				let selectedItem = this.$prompter.promptForChoice("Select action", choices).wait();
				switch(selectedItem){
					case removeItemChoice:
						selectedVersion = this.selectPluginVersion(version, installedPlugin).wait();
						this.removePluginCore(pluginName, installedPlugin, configurationToRemove).wait();
						this.configurePluginCore(pluginName, selectedConfiguration, selectedVersion).wait();
						break;
					case modifyBothConfigs:
						selectedVersion = this.selectPluginVersion(version, installedPlugin).wait();
						this.configurePlugin(pluginName, selectedVersion, this.configurations).wait();
						break;
					default:
						this.$errors.failWithoutHelp("The operation will not be completed.");
				}
			} else {
				this.$errors.failWithoutHelp(`Plugin ${pluginName} is enabled in both configurations and you are trying to enable it in one only. You cannot do this in non-interactive terminal.`);
			}
		}).future<void>()();
	}

	private selectPluginVersion(version: string, plugin: IPlugin, options?: { excludeCurrentVersion: boolean }): IFuture<string> {
		return ((): string => {
			let pluginName = plugin.data.Name;
			let versions = this.getPluginVersions(plugin);
			if(version) {
				if(!_.any(versions, v => v.value === version)) {
					this.$errors.failWithoutHelp("Invalid version %s. The valid versions are: %s.", version, versions.map(v => v.value).join(", "));
				}
			} else if(this.$options.latest) {
				// server returns the versions in descending order
				version = _.first(versions).value;
			} else if(this.$options.default) {
				version = (<IMarketplacePlugin>plugin).pluginVersionsData.DefaultVersion;
			} else {
				if(options && options.excludeCurrentVersion) {
					let currentVersionIndex = _.findIndex(versions,(v) => v.value === plugin.data.Version);
					versions.splice(currentVersionIndex, 1);
				}
				version = this.promptForVersion(pluginName, versions).wait();
			}

			return version;
		}).future<string>()();
	}

	/**
	 * Gets the id of a plugin based on its name by checking all available plugins.
	 * This is required in case the plugin is renamed, but its plugin identifier has not been changed.
	 * @param {string} pluginName The plugin name that has to be checked.
	 * @returns {string} The id of the plugin if there's only one plugin identifier for the specified name.
	 * In case there are more than one ids for the specified name or there's no match, empty string is returned. 
	 */
	private getPluginIdFromName(pluginName: string): string {
		let pluginNameToLowerCase = pluginName.toLowerCase();
		let matchingPluginIds = _(this.getAvailablePlugins())
			.filter(pl => pl.data.Name.toLowerCase() === pluginNameToLowerCase)
			.map(pl => pl.data.Identifier)
			.unique()
			.value();
		if(matchingPluginIds.length === 1) {
			return matchingPluginIds[0];
		}
		return "";
	}

	/**
	 * Checks if the plugin type is Marketplace.
	 * @param {IPlugin} plugin the instace that has to be checked.
	 * @returns {boolean} true if the provided plugin is marketplace, false otherwise.
	 */
	private isMarketplacePlugin(plugin: IPlugin): boolean {
		return plugin && plugin.type.toString().toLowerCase() === pluginsDataLib.PluginType.MarketplacePlugin.toString().toLowerCase();
	}
}
$injector.register("pluginsService", PluginsService);

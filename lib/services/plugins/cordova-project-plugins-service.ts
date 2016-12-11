import * as util from "util";
import * as helpers from "../../common/helpers";
import {NODE_MODULES_DIR_NAME} from "../../common/constants";
import * as semver from "semver";
import * as path from "path";
import * as xmlMapping from "xml-mapping";
import {EOL} from "os";
import {PluginType, CordovaPluginData} from "../../plugins-data";
import {CordovaPluginsService} from "./cordova-plugins";
import {PluginsServiceBase} from "./plugins-service-base";
import Future = require("fibers/future");

export class CordovaProjectPluginsService extends PluginsServiceBase implements IPluginsService {
	private static CORE_PLUGINS_PROPERTY_NAME = "CorePlugins";
	private static CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME = "CordovaPluginVariables";
	private static HEADERS = ["Core Plugins", "Advanced Plugins", "Marketplace Plugins", "Local Plugins"];

	private _identifierToPlugin: IDictionary<IPlugin>;
	private _obsoletedIntegratedPlugins: any;
	private pluginsForbiddenConfigurations: IStringDictionary = {
		"com.telerik.LivePatch": this.$projectConstants.DEBUG_CONFIGURATION_NAME
	};
	private _localPlugins: IPlugin[];

	constructor(private $cordovaPluginsService: CordovaPluginsService,
		private $loginManager: ILoginManager,
		private $marketplacePluginsService: ICordovaPluginsService,
		private $resources: IResourceLoader,
		$errors: IErrors,
		$logger: ILogger,
		$prompter: IPrompter,
		$fs: IFileSystem,
		$project: Project.IProject,
		$projectConstants: Project.IConstants,
		$childProcess: IChildProcess,
		$httpClient: Server.IHttpClient,
		$options: IOptions,
		$npmService: INpmService,
		$hostInfo: IHostInfo,
		$npmPluginsService: INpmPluginsService) {
		super($errors, $logger, $prompter, $fs, $project, $projectConstants, $childProcess, $httpClient, $options, $npmService, $hostInfo, $npmPluginsService);
	}

	private get identifierToPlugin(): IDictionary<IPlugin> {
		if (!this._identifierToPlugin) {
			this.loadPluginsData().wait();
		}

		return this._identifierToPlugin;
	}

	/**
	 * Gets all configurations splecified by the user - options.debug, options.release and options.config.
	 */
	private get specifiedConfigurations(): string[] {
		// If the user has specified options.debug or options.release the length of this.$project.configurations will be 1 and we need to count this option for specified. If non of them is specified the length will be 2 and we do not need to count both release and debug for specified.
		return _(this.$project.configurations.length > 1 ? [] : this.$project.configurations)
			.concat(this.$project.getConfigurationsSpecifiedByUser())
			.uniq()
			.value();
	}

	public getInstalledPlugins(): IPlugin[] {
		let corePlugins: IPlugin[] = [];
		if (this.specifiedConfigurations.length) {
			corePlugins = _(this.specifiedConfigurations)
				.map((configuration: string) => this.getInstalledPluginsForConfiguration(configuration))
				.flatten<IPlugin>()
				.value();
		} else {
			corePlugins = this.getInstalledPluginsForConfiguration();
		}

		return corePlugins.concat(this.getLocalPlugins().wait());
	}

	public getAvailablePlugins(pluginsCount?: number): IPlugin[] {
		let plugins: IPlugin[] = _.values(this.identifierToPlugin);
		if (this.$project.projectData) {
			plugins = _.filter(plugins, pl => this.isPluginSupported(pl, this.$project.projectData.FrameworkVersion));
		}

		return plugins.concat(this.getLocalPlugins().wait());
	}

	public addPlugin(pluginName: string): IFuture<void> {
		return (() => {
			if (!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			let pluginBasicInfo = this.getPluginBasicInformation(pluginName).wait();
			pluginName = pluginBasicInfo.name;
			let version = pluginBasicInfo.version;

			let pluginNameToLowerCase = pluginName.toLowerCase();
			let plInstances: IPlugin[];

			try {
				plInstances = this.getPluginInstancesByName(pluginName);
			} catch (err) {
				// If the user tries to add npm plugin we should fetch it.
				this.$logger.info(`The plugin '${pluginName}' was not found in our list of verified Cordova plugins. We will try to find it in npm and it will be fetched instead of added.`);
				this.fetch(pluginName).wait();
				return;
			}

			if (!plInstances || !plInstances.length) {
				this.$errors.failWithoutHelp("Invalid plugin name: %s", pluginName);
			}

			let installedPluginsForConfiguration = this.getInstalledPluginsForConfiguration();
			let installedPluginInstances = installedPluginsForConfiguration
				.filter(pl => pl.data.Name.toLowerCase() === pluginNameToLowerCase || pl.data.Identifier.toLowerCase() === pluginNameToLowerCase);
			let pluginIdFromName = this.getPluginIdFromName(pluginName).toLowerCase();
			if (!installedPluginInstances.length && pluginIdFromName) {
				this.$logger.trace(`Unable to find installed plugin with specified name: '${pluginName}'. Trying to find if this is an old name of installed plugin.`);
				installedPluginInstances = installedPluginsForConfiguration.filter(pl => pl.data.Identifier.toLowerCase() === pluginIdFromName);
			}

			if (installedPluginInstances && installedPluginInstances.length > 0) {
				let installedPluginsType = _.chain(installedPluginInstances).groupBy((pl: IPlugin) => pl.type).keys().value();
				if (installedPluginsType.length > 1) {
					// In case integrated and Marketplace plugins have duplicate identifiers, try using MarketplacePlugin
					let mpPlugin = _.find(installedPluginInstances, pl => pl.type === PluginType.MarketplacePlugin);
					if (mpPlugin) {
						return this.modifyInstalledMarketplacePlugin(mpPlugin.data.Identifier, version).wait();
					} else {
						this.$errors.failWithoutHelp("There are several plugins with name '%s' and they have different types: '%s'", pluginName, installedPluginsType.join(", "));
					}
				} else if (installedPluginsType.length === 1) {
					if (installedPluginsType[0].toString() === PluginType.MarketplacePlugin.toString()) {
						return this.modifyInstalledMarketplacePlugin(installedPluginInstances[0].data.Identifier, version).wait();
					} else {
						// Check if plugin is installed for current configuration.
						let installedPlugin = this.getInstalledPluginByName(pluginName);
						if (installedPlugin) {
							this.$logger.info("Plugin '%s' is already installed", pluginName);
							return;
						}
					}
				}
			}

			let pluginToAdd = this.getBestMatchingPlugin(pluginName, version);
			if (pluginToAdd.type === PluginType.MarketplacePlugin) {
				version = this.selectPluginVersion(version, pluginToAdd).wait();
				if (!this.isPluginSupported(pluginToAdd, this.$project.projectData.FrameworkVersion, version)) {
					this.$errors.failWithoutHelp(`Plugin ${pluginName} is not available for framework version '${this.$project.projectData.FrameworkVersion}'.`);
				}
			}

			// If there are no configurations specified by the user we need to add the plugin in all configurations.
			let configurations = this.specifiedConfigurations.length ? this.specifiedConfigurations : this.$project.getAllConfigurationsNames();
			if (_(this.pluginsForbiddenConfigurations).keys().find(key => key === pluginToAdd.data.Identifier)) {
				let forbiddenConfig = this.pluginsForbiddenConfigurations[pluginToAdd.data.Identifier];
				if (configurations.length === 1 && _.includes(this.specifiedConfigurations, forbiddenConfig)) {
					this.$errors.failWithoutHelp(`You cannot enable plugin ${pluginName} in ${forbiddenConfig} configuration.`);
				}

				configurations = _.without(configurations, forbiddenConfig);
			}

			this.configurePlugin(pluginName, version, configurations).wait();
		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			if (!pluginName) {
				this.$errors.fail("No plugin name specified.");
			}

			let installedPlugins = this.getInstalledPluginByName(pluginName);
			let plugin = installedPlugins[0];
			if (!plugin) {
				// Need to check the plugins directory because the plugin can be fetched, not added.
				if (this.isPluginFetched(pluginName).wait()) {
					let shouldDeleteFetchedPlugin = true;

					if (helpers.isInteractive()) {
						shouldDeleteFetchedPlugin = this.$prompter.confirm(`The plugin ${pluginName} will be deleted from the plugins folder. Are you sure you want to remove it?`, () => true).wait();
					}

					if (shouldDeleteFetchedPlugin) {
						this.$fs.deleteDirectory(path.join(this.$project.projectDir, this.getPluginsDirName(), pluginName));
						this.$logger.out(`Plugin ${pluginName} was successfully removed.`);
					} else {
						this.$logger.out(`Plugin ${pluginName} was not removed.`);
					}

					return;
				} else {
					this.$errors.failWithoutHelp("Could not find plugin with name %s.", pluginName);
				}
			}

			let obsoletedBy = this.getObsoletedByPluginIdentifier(plugin.data.Identifier).wait();
			let obsoletingKey = this.getObsoletingPluginIdentifier(plugin.data.Identifier).wait();

			if (this.$project.hasBuildConfigurations) {
				// If there are no configurations specified by the user we need to remove the plugin from all configurations.
				let configurations = this.specifiedConfigurations.length ? this.specifiedConfigurations : this.$project.getAllConfigurationsNames();
				_.each(configurations, (configuration: string) => {
					this.removePluginCore(pluginName, plugin, configuration).wait();
					if (obsoletedBy) {
						this.removePluginCore(obsoletedBy, this.identifierToPlugin[`${obsoletedBy}@${plugin.data.Version}`], configuration).wait();
					}
					if (obsoletingKey) {
						this.removePluginCore(obsoletingKey, this.identifierToPlugin[obsoletingKey], configuration).wait();
					}
				});
			} else {
				this.removePluginCore(pluginName, plugin).wait();
				if (obsoletedBy) {
					this.removePluginCore(obsoletedBy, this.identifierToPlugin[`${obsoletedBy}@${plugin.data.Version}`]).wait();
				}
				if (obsoletingKey) {
					this.removePluginCore(obsoletingKey, this.identifierToPlugin[obsoletingKey]).wait();
				}
			}
		}).future<void>()();
	}

	public printPlugins(plugins: IPlugin[]): void {
		let pluginsToPrint: IPlugin[] = plugins;
		if (this.$options.available) {
			// Group marketplace plugins
			let marketplacePlugins = _.filter(plugins, (pl) => pl.type === PluginType.MarketplacePlugin);
			pluginsToPrint = _.filter(plugins, pl => pl.type === PluginType.CorePlugin || pl.type === PluginType.AdvancedPlugin);

			let groups = _.groupBy(marketplacePlugins, (plugin: IPlugin) => plugin.data.Identifier);
			_.each(groups, (group: any) => {
				let defaultData = _.find(group, (gr: IPlugin) => {
					let pvd = (<any>gr).pluginVersionsData;
					return pvd && gr.data.Version === pvd.DefaultVersion;
				});
				if (defaultData) {
					pluginsToPrint.push(defaultData);
				}
			});
		}

		this.printPluginsCore(pluginsToPrint);
	}

	public isPluginInstalled(pluginName: string): boolean {
		let installedPluginInstances = this.getInstalledPluginByName(pluginName);
		return (installedPluginInstances && installedPluginInstances.length > 0) || this.isPluginFetched(pluginName).wait();
	}

	public configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void> {
		return (() => {
			if (this.$project.hasBuildConfigurations) {
				let configs = configurations || (this.specifiedConfigurations.length ? this.specifiedConfigurations : this.$project.getAllConfigurationsNames());
				_.each(configs, (configuration: string) => {
					this.configurePluginCore(pluginName, configuration, version).wait();
				});
			} else {
				this.configurePluginCore(pluginName, version).wait();
			}
		}).future<void>()();
	}

	public getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation> {
		let dependencyInfo = this.$npmService.getDependencyInformation(pluginName);

		return Future.fromResult({
			name: dependencyInfo.name,
			version: dependencyInfo.version
		});
	}

	public getPluginVersions(plugin: IPlugin): IPluginVersion[] {
		let pluginVersionsData = (<IMarketplacePlugin>plugin).pluginVersionsData;
		return _.map(pluginVersionsData.Versions, p => {
			let pluginVersion: IPluginVersion = {
				name: p.Version,
				value: p.Version,
				cordovaVersionRange: p.SupportedVersion
			};

			return pluginVersion;
		});
	}

	public filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]> {
		return (() => {
			let obsoletedIntegratedPlugins = _.keys(this.getObsoletedIntegratedPlugins()).map(pluginId => pluginId.toLowerCase());
			return _.filter(plugins, pl => !_.some(obsoletedIntegratedPlugins, obsoletedId => obsoletedId === pl.data.Identifier.toLowerCase() && pl.type !== PluginType.MarketplacePlugin));
		}).future<IPlugin[]>()();
	}

	protected shouldCopyToPluginsDirectory(pathToPlugin: string): boolean {
		return super.shouldCopyToPluginsDirectory(pathToPlugin) || pathToPlugin.indexOf(path.join(this.$project.projectDir, NODE_MODULES_DIR_NAME)) >= 0;
	}

	protected getPluginsDirName(): string {
		return "plugins";
	}

	protected composeSearchQuery(keywords: string[]): string[] {
		keywords.push("ecosystem:cordova");
		return keywords;
	}

	protected installLocalPluginCore(pathToPlugin: string, pluginOpts: ILocalPluginData): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let pluginXml = this.getPluginXmlContent(pathToPlugin);

			return this.getLocalPluginBasicInformation(pluginXml).wait();
		}).future<IBasicPluginInformation>()();
	}

	protected fetchPluginBasicInformationCore(pathToInstalledPlugin: string, version: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			// We do not need to add the plugin to .abproject file because it will be sent with the plugins directory.
			pluginData.addPluginToConfigFile = false;

			let pluginBasicInfo = super.installLocalPlugin(pathToInstalledPlugin, pluginData, options).wait();
			let configurations = this.specifiedConfigurations.length ? this.specifiedConfigurations : this.$project.getAllConfigurationsNames();

			_.each(configurations, (configuration) => {
				this.setPluginVariables(pluginBasicInfo.name, pluginBasicInfo.variables, configuration).wait();
			});

			this.$project.saveProject(this.$project.projectDir, this.$project.getAllConfigurationsNames()).wait();
			return pluginBasicInfo;
		}).future<IBasicPluginInformation>()();

	}

	protected validatePluginInformation(pathToPlugin: string): void {
		let pluginXml = this.getPluginXmlContent(pathToPlugin);
		if (!pluginXml) {
			this.$errors.failWithoutHelp(`${path.basename(pathToPlugin)} is not a valid Cordova plugin.`);
		}
	}

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

	private getInstalledPluginsForConfiguration(config?: string): IPlugin[] {
		let corePlugins: string[] = [];
		if (config) {
			corePlugins = this.$project.getProperty(CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, config);
		} else {
			corePlugins = _(this.$project.getAllConfigurationsNames())
				.map((configurationName: string) => this.$project.getProperty(CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, configurationName))
				.flatten<string>()
				.filter((pluginName: string) => !!pluginName)
				.uniq()
				.value();
		}

		return _.map(corePlugins, pluginIdentifier => {
			let data = pluginIdentifier.split("@"),
				name = data[0],
				version = data[1];
			let plugin = this.getBestMatchingPlugin(name, version);

			if (!plugin) {
				let failMessage = config ?
					`You have enabled an invalid plugin: ${pluginIdentifier} for the ${config} build configuration. Check your .${config}.abproject file in the project root and correct or remove the invalid plugin entry.` :
					`You have enabled an invalid plugin: ${pluginIdentifier}. Check your ${_.map(this.$project.getAllConfigurationsNames(), (configuration: string) => `.${configuration}.abproject`).join(", ")} files in the project root and correct or remove the invalid plugin entry.`;
				this.$errors.failWithoutHelp(failMessage);
			}

			return plugin;
		});
	}

	private getBestMatchingPlugin(name: string, version: string): IPlugin {
		let plugins = this.getPluginInstancesByName(name, version);
		return _.find(plugins, pl => pl.type === PluginType.MarketplacePlugin) || plugins[0];
	}

	private isPluginSupported(plugin: IPlugin, frameworkVersion: string, pluginVersion?: string): boolean {
		if (!this.isMarketplacePlugin(plugin)) {
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
		let installedPluginInstances = _.filter(installedPlugins, (plugin: IPlugin) => plugin.data.Name.toLowerCase() === pluginName || plugin.data.Identifier.toLowerCase() === pluginName);
		let pluginIdFromName = this.getPluginIdFromName(pluginName).toLowerCase();
		if (!installedPluginInstances.length && pluginIdFromName) {
			this.$logger.trace(`Unable to find installed plugin with specified name: '${pluginName}'. Trying to find if this is an old name of installed plugin.`);
			installedPluginInstances = installedPlugins.filter(pl => pl.data.Identifier.toLowerCase() === pluginIdFromName);
		}

		if (!installedPluginInstances.length) {
			this.$logger.trace("Check if the name is obsoleted one and the old plugin is no longer available, but the new one can be used.");
			let obsoletedBy = this.getObsoletedByPluginIdentifier(pluginName).wait();
			if (obsoletedBy) {
				installedPluginInstances = _.filter(installedPlugins, (plugin: IPlugin) => plugin.data.Identifier.toLowerCase() === obsoletedBy.toLowerCase());
			}
		}

		return installedPluginInstances;
	}

	private configurePluginCore(pluginName: string, configuration?: string, version?: string): IFuture<void> {
		return (() => {
			let plugin = this.getBestMatchingPlugin(pluginName, version);
			let pluginData = <IMarketplacePluginData>plugin.data;

			this.setPluginVariables(pluginData.Identifier, <string[]>pluginData.Variables, configuration).wait();

			let newCorePlugins = this.$project.getProperty(CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration) || [];
			// remove all instances of the plugin from current configuration
			newCorePlugins = _.without.apply(null, [ newCorePlugins ].concat(this.getPluginInstancesByName(plugin.data.Identifier).map(plug => plug.toProjectDataRecord())));
			let obsoletedBy = this.getObsoletedByPluginIdentifier(plugin.data.Identifier).wait(),
				obsoletingKey = this.getObsoletingPluginIdentifier(plugin.data.Identifier).wait();
			if (obsoletedBy) {
				newCorePlugins = _.without.apply(null, [ newCorePlugins ].concat(this.getPluginInstancesByName(obsoletedBy).map(plug => plug.toProjectDataRecord())));
			}

			if (obsoletingKey) {
				newCorePlugins = _.without.apply(null, [ newCorePlugins ].concat(this.getPluginInstancesByName(obsoletingKey).map(plug => plug.toProjectDataRecord())));
			}

			newCorePlugins.push(plugin.toProjectDataRecord(version));

			let versionString = this.isMarketplacePlugin(plugin) ? ` with version ${version || plugin.data.Version}` : "",
				successMessageForConfigSuffix = ` for ${configuration} configuration${versionString}`,
				successMessage = `Plugin ${pluginName} was successfully added${configuration ? successMessageForConfigSuffix : versionString}.`;

			if (configuration) {
				this.$project.updateProjectProperty("set", CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, [configuration]).wait();
			} else {
				this.$project.updateProjectProperty("set", CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins).wait();
			}

			this.$project.saveProject(this.$project.projectDir, this.$project.getAllConfigurationsNames()).wait();

			this.$logger.out(successMessage);
		}).future<void>()();
	}

	private removePluginCore(pluginName: string, plugin: IPlugin, configuration?: string): IFuture<void> {
		return (() => {
			let pluginData = <IMarketplacePluginData>plugin.data;
			let cordovaPluginVariables = this.$project.getProperty(CordovaProjectPluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration);

			if (cordovaPluginVariables && _.keys(cordovaPluginVariables[pluginData.Identifier]).length > 0) {
				_.each(pluginData.Variables, (variableName: string) => {
					delete cordovaPluginVariables[pluginData.Identifier][variableName];
				});
			}

			if (cordovaPluginVariables && _.keys(cordovaPluginVariables[pluginData.Identifier]).length === 0) {
				delete cordovaPluginVariables[pluginData.Identifier];
			}
			let oldCorePlugins = this.$project.getProperty(CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration);
			let newCorePlugins = _.without(oldCorePlugins, plugin.toProjectDataRecord());
			if (newCorePlugins.length !== oldCorePlugins.length) {
				this.$project.setProperty(CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, configuration);

				if (configuration) {
					this.$project.saveProject(this.$project.getProjectDir(), [configuration]).wait();
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
			_.each(plugins, (plugin: IMarketplacePluginData) => {
				try {
					let data = pluginsService.createPluginData(plugin);
					_.each(data, pluginData => {
						if (pluginData && pluginData.data) {
							let projectDataRecord = pluginData.toProjectDataRecord();
							let configurations = this.$project.configurationSpecificData;
							_.each(configurations, (configData: IDictionary<any>, configuration: string) => {
								if (configData) {
									let corePlugins = configData[CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME];
									if (corePlugins && (_.includes(corePlugins, projectDataRecord) || _.includes(corePlugins, pluginData.data.Identifier))) {
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

	private gatherVariableInformation(pluginIdentifier: string, variableName: string, configuration: string): IFuture<any> {
		return (() => {
			let schema: IPromptSchema = {
				name: variableName,
				type: "input",
				message: configuration ? util.format("Set value for variable %s in %s configuration", variableName, configuration) : util.format("Set value for variable %s", variableName)
			};

			let cordovaPluginVariables = this.$project.getProperty(CordovaProjectPluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration) || {};
			let pluginVariables = cordovaPluginVariables[pluginIdentifier];
			if (pluginVariables && pluginVariables[variableName]) {
				schema["default"] = () => pluginVariables[variableName];
			}

			return this.getPluginVariableFromVarOption(variableName, configuration) || this.$prompter.get([schema]).wait();
		}).future<any>()();
	}

	private getPluginInstancesByName(pluginName: string, version?: string): IPlugin[] {
		let plugins = this.getAvailablePlugins();
		let toLowerCasePluginName = pluginName.toLowerCase();
		let filterAction = (name: string) => {
			let lowercasedValue = name.toLowerCase();
			return _.filter(plugins, (_plugin: IPlugin) => {
				let condition = _plugin.data.Name.toLowerCase() === lowercasedValue || _plugin.data.Identifier.toLowerCase() === lowercasedValue;
				if (version) {
					condition = condition && _plugin.data.Version === version;
				}

				return condition;
			});
		};
		let matchingPlugins = filterAction(toLowerCasePluginName);
		let realIdentifier: string;
		if (!matchingPlugins || !matchingPlugins.length) {
			realIdentifier = pluginName;
		}

		realIdentifier = realIdentifier || matchingPlugins[0].data.Identifier;
		let obsoletedBy = this.getObsoletedByPluginIdentifier(realIdentifier).wait();
		if (obsoletedBy) {
			let obsoletedByPlugins = filterAction(obsoletedBy);
			matchingPlugins = matchingPlugins.concat(obsoletedByPlugins);
		}

		if (!matchingPlugins || !matchingPlugins.length) {
			this.$errors.fail("Invalid plugin name: %s", pluginName);
		}

		return matchingPlugins;
	}

	private promptForVersion(pluginName: string, versions: any[]): IFuture<string> {
		return (() => {
			return versions.length > 1 ? this.promptForVersionCore(pluginName, versions).wait() : versions[0].value;
		}).future<string>()();
	}

	private promptForVersionCore(pluginName: string, versions: any[]): IFuture<string> {
		return (() => {
			let version: string;
			if (helpers.isInteractive()) {
				version = this.$prompter.promptForChoice("Which plugin version do you want to use?", versions).wait();
			} else {
				this.$errors.failWithoutHelp(`You must specify valid version in order to update your plugin when terminal is not interactive.`);
			}

			return version;
		}).future<string>()();
	}

	private printPluginsCore(plugins: IPlugin[]): void {
		let groups = _.groupBy(plugins, (plugin: IPlugin) => plugin.type);
		let outputLines: string[] = [];

		_.each(Object.keys(groups), (group: string) => {
			outputLines.push(util.format("%s:%s======================", CordovaProjectPluginsService.HEADERS[+group], EOL));

			let sortedPlugins = _.sortBy(groups[group], (plugin: IPlugin) => plugin.data.Name);
			_.each(sortedPlugins, (plugin: IPlugin) => {
				outputLines.push(plugin.pluginInformation.join(EOL));
			});
		});

		this.$logger.out(outputLines.join(EOL + EOL));
	}

	private modifyInstalledMarketplacePlugin(pluginName: string, version: string): IFuture<void> {
		return ((): void => {
			pluginName = pluginName.toLowerCase();
			let isConsoleInteractive = helpers.isInteractive();
			let allInstalledPlugins = this.getInstalledPluginsForConfiguration();
			let installedPluginInstances = _(allInstalledPlugins)
				.filter((plugin: IPlugin) => plugin.data.Name.toLowerCase() === pluginName || plugin.data.Identifier.toLowerCase() === pluginName)
				.uniqBy((plugin: IPlugin) => plugin.data.Version)
				.value();

			let selectedVersion: string;
			if (installedPluginInstances.length > 1) {
				this.$logger.warn(`Plugin '${pluginName}' is enabled with different versions in your project configurations. You must use the same version in all configurations.`);
			}

			_.each(installedPluginInstances, (pl: IPlugin) => {
				let configString = pl.configurations.length > 1 ? `'${pl.configurations.join(", ")}' configurations` : `'${pl.configurations[0]}' configuration`;
				this.$logger.info(`Plugin '${pluginName}' is enabled in ${configString} with version '${pl.data.Version}'.`);
			});

			let installedPlugin = installedPluginInstances[0];
			// in case options.debug, options.release and options.config  are not specified, let's just update all configurations without asking for prompt.
			if (!this.specifiedConfigurations.length) {
				selectedVersion = this.selectPluginVersion(version, installedPlugin).wait();
				this.configurePlugin(pluginName, selectedVersion, this.$project.getAllConfigurationsNames()).wait();
				return;
			}

			let configurationsToRemove = _.difference(installedPlugin.configurations, this.specifiedConfigurations);

			// If we have plugins with different version in different configurations there will be more than one pluginInstance in the installedPluginInstances and we need to get their configurations too.
			let configurationsToEdit = _(installedPluginInstances)
				.map((pluginInstance: IPlugin) => pluginInstance.configurations)
				.flatten()
				.concat(this.specifiedConfigurations)
				.uniq()
				.value();

			let removeItemChoice = `Remove plugin from [${configurationsToRemove.join(", ")}] configuration and add it to [${this.specifiedConfigurations.join(", ")}] configuration only.`;
			let modifyAllConfigs = `Enable plugin in [${configurationsToEdit.join(", ")}] configurations with same version.`;
			let cancelOperation = "Cancel operation.";
			let choices = [modifyAllConfigs, cancelOperation];

			if (configurationsToRemove.length) {
				choices.unshift(removeItemChoice);
			}

			if (!configurationsToRemove.length && installedPlugin.configurations.length === this.specifiedConfigurations.length) {
				if (installedPluginInstances.length > 1 && !helpers.isInteractive()) {
					this.$errors.failWithoutHelp(`Plugin ${pluginName} is enabled in multiple configurations and you are trying to enable it in one only. You cannot do this in non-interactive terminal.`);
				}

				selectedVersion = this.selectPluginVersion(version, installedPlugin, { excludeCurrentVersion: true }).wait();
				_.each(configurationsToEdit, (selectedConfiguration: string) => this.configurePluginCore(pluginName, selectedConfiguration, selectedVersion).wait());
				return;
			}

			if (isConsoleInteractive) {
				let selectedItem = this.$prompter.promptForChoice("Select action", choices).wait();
				switch (selectedItem) {
					case removeItemChoice:
						selectedVersion = this.selectPluginVersion(version, installedPlugin).wait();
						_.each(configurationsToRemove, (configurationToRemove: string) => this.removePluginCore(pluginName, installedPlugin, configurationToRemove).wait());
						_.each(this.specifiedConfigurations, (selectedConfiguration: string) => this.configurePluginCore(pluginName, selectedConfiguration, selectedVersion).wait());
						break;
					case modifyAllConfigs:
						selectedVersion = this.selectPluginVersion(version, installedPlugin).wait();
						this.configurePlugin(pluginName, selectedVersion, configurationsToEdit).wait();
						break;
					default:
						this.$errors.failWithoutHelp("The operation will not be completed.");
				}
			} else {
				this.$errors.failWithoutHelp(`Plugin ${pluginName} is enabled in multiple configurations and you are trying to enable it in one only. You cannot do this in non-interactive terminal.`);
			}
		}).future<void>()();
	}

	private selectPluginVersion(version: string, plugin: IPlugin, options?: { excludeCurrentVersion: boolean }): IFuture<string> {
		return ((): string => {
			let pluginName = plugin.data.Name;
			let versions = this.getPluginVersions(plugin);
			if (version) {
				if (!_.some(versions, v => v.value === version)) {
					this.$errors.failWithoutHelp("Invalid version %s. The valid versions are: %s.", version, versions.map(v => v.value).join(", "));
				}
			} else if (this.$options.latest) {
				// server returns the versions in descending order
				version = _.first(versions).value;
			} else if (this.$options.default) {
				version = this.getDefaultPluginVersion(plugin);
			} else {
				if (options && options.excludeCurrentVersion) {
					let currentVersionIndex = _.findIndex(versions, (v) => v.value === plugin.data.Version);
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
			.uniq()
			.value();
		if (matchingPluginIds.length === 1) {
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
		return plugin && plugin.type.toString().toLowerCase() === PluginType.MarketplacePlugin.toString().toLowerCase();
	}

	/**
	 * Checks if the specified CordovaPluginVariable exists in the --var option specified by user.
	 * The variable can be added to --var option for configuration or globally, for ex.:
	 * `--var.APP_ID myAppIdentifier` or `--var.debug.APP_ID myAppIdentifier`.
	 * NOTE: If the variable is added for specific configuration and globally,
	 * the value for the specified configuration will be used as it has higher priority. For ex.:
	 * `--var.APP_ID myAppIdentifier1 --var.debug.APP_ID myAppIdentifier2` will return myAppIdentifier2 for debug configuration
	 * and myAppIdentifier for release configuration.
	 * @param {string} variableName The name of the plugin variable.
	 * @param {string} configuration The configuration for which the variable will be used.
	 * @returns {any} The value of the plugin variable specified in --var or undefined.
	 */
	private getPluginVariableFromVarOption(variableName: string, configuration: string): any {
		let varOption = this.$options.var;
		configuration = configuration && configuration.toLowerCase();
		let lowerCasedVariableName = variableName.toLowerCase();
		if (varOption) {
			let configVariableValue: string;
			let generalVariableValue: string;
			if (variableName.indexOf(".") !== -1) {
				varOption = this.simplifyYargsObject(varOption, configuration);
			}
			_.each(varOption, (propValue: any, propKey: string) => {
				if (propKey.toLowerCase() === configuration) {
					_.each(propValue, (configPropValue: string, configPropKey: string) => {
						if (configPropKey.toLowerCase() === lowerCasedVariableName) {
							configVariableValue = configPropValue;
							return false;
						}
					});
				} else if (propKey.toLowerCase() === lowerCasedVariableName) {
					generalVariableValue = propValue;
				}
			});

			let value = configVariableValue || generalVariableValue;
			if (value) {
				let obj = Object.create(null);
				obj[variableName] = value.toString();
				return obj;
			}
		}

		return undefined;
	}

	/**
	 * Converts complicated yargs object with many subobjects, to simplified one.
	 * Use it when the plugin variable contains dots ("."). In this case yargs treats them as inner object instead of propery name.
	 * For ex. '--var.debug.DATA.APP.ID testId' will be converted to {debug: {DATA: {APP: {ID: testId}}}}, while we need {debug: {DATA.APP.ID: testId}}
	 * '--var.DATA.APP.ID testId' will be converted to DATA: {APP: {ID: testId}}}, while we need {DATA.APP.ID: testId}
	 * @param {any} obj varObject created by yargs
	 * @param {string} configuration The configuration for which the plugin variable will be used.
	 * @return {any} Converted object if the obj paramater is of type object, otherwise - the object itself.
	 */
	private simplifyYargsObject(obj: any, configuration: string): any {
		if (obj && typeof (obj) === "object") {
			let convertedObject: any = Object.create({});

			_.each(obj, (propValue: any, propKey: string) => {
				if (typeof (propValue) !== "object") {
					convertedObject[propKey] = propValue;
					return false;
				}

				let innerObj = this.simplifyYargsObject(propValue, configuration);
				if (propKey.toLowerCase() === configuration.toLowerCase()) {
					// for --var.debug.DATA.APP.ID testId
					convertedObject[propKey] = innerObj;
				} else {
					// for --var.DATA.APP.ID testId
					_.each(innerObj, (innerPropValue: any, innerPropKey: string) => {
						convertedObject[`${propKey}.${innerPropKey}`] = innerPropValue;
					});
				}

			});

			return convertedObject;
		}

		return obj;
	}

	private getObsoletedIntegratedPlugins(): any {
		if (!this._obsoletedIntegratedPlugins) {
			let cordovaJsonContent = this.$fs.readJson(path.join(this.$resources.resolvePath("Cordova"), "cordova.json"));
			this._obsoletedIntegratedPlugins = cordovaJsonContent && cordovaJsonContent.obsoletedIntegratedPlugins;
		}

		return this._obsoletedIntegratedPlugins;
	}

	private getObsoletedByPluginIdentifier(pluginIdentifier: string): IFuture<string> {
		return ((): string => {
			let obsoletedByInfo = _.find(this.getObsoletedIntegratedPlugins(), (obsoletedPluginInfo: any, key: string) => key.toLowerCase() === pluginIdentifier.toLowerCase()) || Object.create(null);
			return obsoletedByInfo.obsoletedBy;
		}).future<string>()();
	}

	private getObsoletingPluginIdentifier(pluginIdentifier: string): IFuture<string> {
		return ((): string => {
			let obsoletingKey: string;

			_.each(this.getObsoletedIntegratedPlugins(), (obsoletedPluginInfo: any, key: string) => {
				if (obsoletedPluginInfo.obsoletedBy.toLowerCase() === pluginIdentifier.toLowerCase()) {
					obsoletingKey = key;
					return false;
				}
			});

			return obsoletingKey;
		}).future<string>()();
	}

	private getLocalPlugins(): IFuture<IPlugin[]> {
		return ((): IPlugin[] => {
			if (!this._localPlugins) {
				let pluginsDir = path.join(this.$project.projectDir, "plugins");
				if (!this.$fs.exists(pluginsDir)) {
					return [];
				}

				this._localPlugins = _(this.$fs.readDirectory(pluginsDir))
					.map((pluginName: string) => {
						let pathToPlugin = path.join(pluginsDir, pluginName);
						if (this.$fs.getFsStats(pathToPlugin).isFile()) {
							return null;
						}

						let pluginXml = this.getPluginXmlContent(pathToPlugin);
						let basicPluginInfo = this.getLocalPluginBasicInformation(pluginXml).wait();
						let plugin = pluginXml.plugin;
						let platforms = _.isArray(plugin.platform) ? _.map(plugin.platform, (p: any) => p.name) : _.filter([plugin.platform && plugin.platform.name]);
						let identifier = plugin.id;
						let url = "";

						if (_.has(plugin, "repo")) {
							url = plugin.repo.$t;
						}

						if (!url && _.has(plugin, "url")) {
							url = plugin.url.$t;
						}

						let data: IMarketplacePluginData = {
							Name: basicPluginInfo.name,
							Description: basicPluginInfo.description,
							Assets: null,
							AndroidRequiredPermissions: null,
							Authors: [basicPluginInfo.author],
							Url: url,
							Identifier: identifier,
							Version: basicPluginInfo.version,
							Variables: basicPluginInfo.variables,
							Publisher: { Name: basicPluginInfo.author, Url: url },
							DownloadsCount: 0,
							SupportedVersion: basicPluginInfo.version,
							Platforms: platforms
						};

						return new CordovaPluginData(data, PluginType.LocalPlugin, this.$project, this.$projectConstants);
					})
					.filter((plugin: IPlugin) => !!plugin)
					.value();
			}

			return this._localPlugins;
		}).future<IPlugin[]>()();
	}

	private getLocalPluginBasicInformation(pluginXml: any): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			// Need to add $t because of the xmlMapping library.
			let basicPluginInformation: IBasicPluginInformation = {
				name: pluginXml.plugin.name.$t,
				description: pluginXml.plugin.description.$t,
				version: pluginXml.plugin.version
			};

			let pluginVariables: any[] = [];
			if (pluginXml.plugin.preference) {
				// Need to check if the preference property is array or not because thats how the xmlMapping transforms the xml to json.
				if (_.isArray(pluginXml.plugin.preference)) {
					_.each(pluginXml.plugin.preference, (preference: any) => {
						pluginVariables.push(preference);
					});
				} else {
					pluginVariables.push(pluginXml.plugin.preference);
				}
			}

			basicPluginInformation.variables = pluginVariables;
			return basicPluginInformation;
		}).future<IBasicPluginInformation>()();
	}

	private getPluginXmlContent(pathToPlugin: string): any {
		let pathToPluginXml = path.join(pathToPlugin, "plugin.xml");

		if (!this.$fs.exists(pathToPluginXml)) {
			return null;
		}

		return xmlMapping.tojson(this.$fs.readText(pathToPluginXml));
	}

	private setPluginVariables(pluginIdentifier: string, variables: string[], configuration: string): IFuture<void> {
		return (() => {
			let originalPluginVariables = this.$project.getProperty(CordovaProjectPluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration) || {};
			let cordovaPluginVariables: any = _.cloneDeep(originalPluginVariables);

			if (variables && variables.length > 0) {
				if (!cordovaPluginVariables[pluginIdentifier]) {
					cordovaPluginVariables[pluginIdentifier] = {};
				}

				_.each(variables, (variable: any) => {
					let variableName: string = variable.name || variable;
					let variableInformation = this.gatherVariableInformation(pluginIdentifier, variableName, configuration).wait();
					cordovaPluginVariables[pluginIdentifier][variableName] = variableInformation[variableName];
				});
				this.$project.setProperty(CordovaProjectPluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, cordovaPluginVariables, configuration);
			}
		}).future<void>()();
	}
}

$injector.register("cordovaProjectPluginsService", CordovaProjectPluginsService);

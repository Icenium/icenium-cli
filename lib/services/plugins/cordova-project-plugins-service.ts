import * as util from "util";
import * as helpers from "../../common/helpers";
import { NODE_MODULES_DIR_NAME } from "../../common/constants";
import * as semver from "semver";
import * as path from "path";
import * as xmlMapping from "xml-mapping";
import { EOL } from "os";
import { PluginType, CordovaPluginData } from "../../plugins-data";
import { CordovaPluginsService } from "./cordova-plugins";
import { PluginsServiceBase } from "./plugins-service-base";

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

	private async getIdentifierToPlugin(): Promise<IDictionary<IPlugin>> {
		if (!this._identifierToPlugin) {
			await this.loadPluginsData();
		}

		return this._identifierToPlugin;
	}

	public async getInstalledPlugins(): Promise<IPlugin[]> {
		let corePlugins: IPlugin[] = [];
		if (this.specifiedConfigurations.length) {
			corePlugins = _(this.specifiedConfigurations)
				.map((configuration: string) => this.getInstalledPluginsForConfiguration(configuration))
				.flatten<IPlugin>()
				.value();
		} else {
			corePlugins = await this.getInstalledPluginsForConfiguration();
		}

		return corePlugins.concat(this.getLocalPlugins());
	}

	public async getAvailablePlugins(pluginsCount?: number): Promise<IPlugin[]> {
		let plugins: IPlugin[] = _.values(await this.getIdentifierToPlugin());
		if (this.$project.projectData) {
			plugins = _.filter(plugins, pl => this.isPluginSupported(pl, this.$project.projectData.FrameworkVersion));
		}

		return plugins.concat(this.getLocalPlugins());
	}

	public async addPlugin(pluginName: string): Promise<void> {
		if (!pluginName) {
			this.$errors.fail("No plugin name specified");
		}

		let pluginBasicInfo = await this.getPluginBasicInformation(pluginName);
		pluginName = pluginBasicInfo.name;
		let version = pluginBasicInfo.version;

		let pluginNameToLowerCase = pluginName.toLowerCase();
		let plInstances: IPlugin[];

		try {
			plInstances = await this.getPluginInstancesByName(pluginName);
		} catch (err) {
			// If the user tries to add npm plugin we should fetch it.
			this.$logger.info(`The plugin '${pluginName}' was not found in our list of verified Cordova plugins. We will try to find it in npm and it will be fetched instead of added.`);
			await this.fetch(pluginName);
			return;
		}

		if (!plInstances || !plInstances.length) {
			this.$errors.failWithoutHelp("Invalid plugin name: %s", pluginName);
		}

		let installedPluginsForConfiguration = await this.getInstalledPluginsForConfiguration();
		let installedPluginInstances = installedPluginsForConfiguration
			.filter(pl => pl.data.Name.toLowerCase() === pluginNameToLowerCase || pl.data.Identifier.toLowerCase() === pluginNameToLowerCase);
		let pluginIdFromName = (await this.getPluginIdFromName(pluginName)).toLowerCase();
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
					return await this.modifyInstalledMarketplacePlugin(mpPlugin.data.Identifier, version);
				} else {
					this.$errors.failWithoutHelp("There are several plugins with name '%s' and they have different types: '%s'", pluginName, installedPluginsType.join(", "));
				}
			} else if (installedPluginsType.length === 1) {
				if (installedPluginsType[0].toString() === PluginType.MarketplacePlugin.toString()) {
					return await this.modifyInstalledMarketplacePlugin(installedPluginInstances[0].data.Identifier, version);
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

		let pluginToAdd = await this.getBestMatchingPlugin(pluginName, version);
		if (pluginToAdd.type === PluginType.MarketplacePlugin) {
			version = await this.selectPluginVersion(version, pluginToAdd);
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

		await this.configurePlugin(pluginName, version, configurations);
	}

	public async removePlugin(pluginName: string): Promise<void> {
		if (!pluginName) {
			this.$errors.fail("No plugin name specified.");
		}

		let installedPlugins = await this.getInstalledPluginByName(pluginName);
		let plugin = installedPlugins[0];
		if (!plugin) {
			// Need to check the plugins directory because the plugin can be fetched, not added.
			if (this.isPluginFetched(pluginName)) {
				let shouldDeleteFetchedPlugin = true;

				if (helpers.isInteractive()) {
					shouldDeleteFetchedPlugin = await this.$prompter.confirm(`The plugin ${pluginName} will be deleted from the plugins folder. Are you sure you want to remove it?`, () => true);
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

		let obsoletedBy = await this.getObsoletedByPluginIdentifier(plugin.data.Identifier);
		let obsoletingKey = await this.getObsoletingPluginIdentifier(plugin.data.Identifier);

		let identifierToPlugin = await this.getIdentifierToPlugin();
		if (this.$project.hasBuildConfigurations) {
			// If there are no configurations specified by the user we need to remove the plugin from all configurations.
			let configurations = this.specifiedConfigurations.length ? this.specifiedConfigurations : this.$project.getAllConfigurationsNames();
			_.each(configurations, (configuration: string) => {
				this.removePluginCore(pluginName, plugin, configuration);
				if (obsoletedBy) {
					this.removePluginCore(obsoletedBy, identifierToPlugin[`${obsoletedBy}@${plugin.data.Version}`], configuration);
				}
				if (obsoletingKey) {
					this.removePluginCore(obsoletingKey, identifierToPlugin[obsoletingKey], configuration);
				}
			});
		} else {
			this.removePluginCore(pluginName, plugin);
			if (obsoletedBy) {
				this.removePluginCore(obsoletedBy, identifierToPlugin[`${obsoletedBy}@${plugin.data.Version}`]);
			}
			if (obsoletingKey) {
				this.removePluginCore(obsoletingKey, identifierToPlugin[obsoletingKey]);
			}
		}
	}

	public async printPlugins(plugins: IPlugin[]): Promise<void> {
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

	public async isPluginInstalled(pluginName: string): Promise<boolean> {
		let installedPluginInstances = await this.getInstalledPluginByName(pluginName);
		return (installedPluginInstances && installedPluginInstances.length > 0) || this.isPluginFetched(pluginName);
	}

	public async configurePlugin(pluginName: string, version?: string, configurations?: string[]): Promise<void> {
		if (this.$project.hasBuildConfigurations) {
			let configs = configurations || (this.specifiedConfigurations.length ? this.specifiedConfigurations : this.$project.getAllConfigurationsNames());
			_.each(configs, async (configuration: string) => {
				await this.configurePluginCore(pluginName, configuration, version);
			});
		} else {
			await this.configurePluginCore(pluginName, version);
		}
	}

	public async getPluginBasicInformation(pluginName: string): Promise<IBasicPluginInformation> {
		let dependencyInfo = this.$npmService.getDependencyInformation(pluginName);

		return Promise.resolve({
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

	public async filterPlugins(plugins: IPlugin[]): Promise<IPlugin[]> {
		let obsoletedIntegratedPlugins = _.keys(this.getObsoletedIntegratedPlugins()).map(pluginId => pluginId.toLowerCase());
		return _.filter(plugins, pl => !_.some(obsoletedIntegratedPlugins, obsoletedId => obsoletedId === pl.data.Identifier.toLowerCase() && pl.type !== PluginType.MarketplacePlugin));
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

	protected async installLocalPluginCore(pathToPlugin: string, pluginOpts: ILocalPluginData): Promise<IBasicPluginInformation> {
		let pluginXml = this.getPluginXmlContent(pathToPlugin);

		return await this.getLocalPluginBasicInformation(pluginXml);
	}

	protected async fetchPluginBasicInformationCore(pathToInstalledPlugin: string, version: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): Promise<IBasicPluginInformation> {
		// We do not need to add the plugin to .abproject file because it will be sent with the plugins directory.
		pluginData.addPluginToConfigFile = false;

		let pluginBasicInfo = await super.installLocalPlugin(pathToInstalledPlugin, pluginData, options);
		let configurations = this.specifiedConfigurations.length ? this.specifiedConfigurations : this.$project.getAllConfigurationsNames();

		_.each(configurations, async (configuration) => {
			await this.setPluginVariables(pluginBasicInfo.name, pluginBasicInfo.variables, configuration);
		});

		this.$project.saveProject(this.$project.projectDir, this.$project.getAllConfigurationsNames());
		return pluginBasicInfo;

	}

	protected validatePluginInformation(pathToPlugin: string): void {
		let pluginXml = this.getPluginXmlContent(pathToPlugin);
		if (!pluginXml) {
			this.$errors.failWithoutHelp(`${path.basename(pathToPlugin)} is not a valid Cordova plugin.`);
		}
	}

	private async loadPluginsData(): Promise<void> {
		// Cordova plugin commands are only applicable to Cordova projects
		await this.$project.ensureCordovaProject();
		await this.$loginManager.ensureLoggedIn();
		this._identifierToPlugin = Object.create(null);
		await this.createPluginsData(this.$cordovaPluginsService)
		await this.createPluginsData(this.$marketplacePluginsService);
	}

	private async getInstalledPluginsForConfiguration(config?: string): Promise<IPlugin[]> {
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

		return Promise.all(_.map(corePlugins, async pluginIdentifier => {
			let data = pluginIdentifier.split("@"),
				name = data[0],
				version = data[1];
			let plugin = await this.getBestMatchingPlugin(name, version);

			if (!plugin) {
				let failMessage = config ?
					`You have enabled an invalid plugin: ${pluginIdentifier} for the ${config} build configuration. Check your .${config}.abproject file in the project root and correct or remove the invalid plugin entry.` :
					`You have enabled an invalid plugin: ${pluginIdentifier}. Check your ${_.map(this.$project.getAllConfigurationsNames(), (configuration: string) => `.${configuration}.abproject`).join(", ")} files in the project root and correct or remove the invalid plugin entry.`;
				this.$errors.failWithoutHelp(failMessage);
			}

			return plugin;
		}));
	}

	private async getBestMatchingPlugin(name: string, version: string): Promise<IPlugin> {
		let plugins = await this.getPluginInstancesByName(name, version);
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

	private async getInstalledPluginByName(pluginName: string): Promise<IPlugin[]> {
		pluginName = pluginName.toLowerCase();
		let installedPlugins = await this.getInstalledPlugins();
		let installedPluginInstances = _.filter(installedPlugins, (plugin: IPlugin) => plugin.data.Name.toLowerCase() === pluginName || plugin.data.Identifier.toLowerCase() === pluginName);
		let pluginIdFromName = (await this.getPluginIdFromName(pluginName)).toLowerCase();
		if (!installedPluginInstances.length && pluginIdFromName) {
			this.$logger.trace(`Unable to find installed plugin with specified name: '${pluginName}'. Trying to find if this is an old name of installed plugin.`);
			installedPluginInstances = installedPlugins.filter(pl => pl.data.Identifier.toLowerCase() === pluginIdFromName);
		}

		if (!installedPluginInstances.length) {
			this.$logger.trace("Check if the name is obsoleted one and the old plugin is no longer available, but the new one can be used.");
			let obsoletedBy = await this.getObsoletedByPluginIdentifier(pluginName);
			if (obsoletedBy) {
				installedPluginInstances = _.filter(installedPlugins, (plugin: IPlugin) => plugin.data.Identifier.toLowerCase() === obsoletedBy.toLowerCase());
			}
		}

		return installedPluginInstances;
	}

	private async configurePluginCore(pluginName: string, configuration?: string, version?: string): Promise<void> {
		let plugin = await this.getBestMatchingPlugin(pluginName, version);
		let pluginData = <IMarketplacePluginData>plugin.data;

		await this.setPluginVariables(pluginData.Identifier, <string[]>pluginData.Variables, configuration);

		let newCorePlugins = this.$project.getProperty(CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, configuration) || [];
		// remove all instances of the plugin from current configuration
		newCorePlugins = _.without.apply(null, [newCorePlugins].concat((await this.getPluginInstancesByName(plugin.data.Identifier)).map(plug => plug.toProjectDataRecord())));
		let obsoletedBy = await this.getObsoletedByPluginIdentifier(plugin.data.Identifier),
			obsoletingKey = await this.getObsoletingPluginIdentifier(plugin.data.Identifier);
		if (obsoletedBy) {
			newCorePlugins = _.without.apply(null, [newCorePlugins].concat((await this.getPluginInstancesByName(obsoletedBy)).map(plug => plug.toProjectDataRecord())));
		}

		if (obsoletingKey) {
			newCorePlugins = _.without.apply(null, [newCorePlugins].concat((await this.getPluginInstancesByName(obsoletingKey)).map(plug => plug.toProjectDataRecord())));
		}

		newCorePlugins.push(plugin.toProjectDataRecord(version));

		let versionString = this.isMarketplacePlugin(plugin) ? ` with version ${version || plugin.data.Version}` : "",
			successMessageForConfigSuffix = ` for ${configuration} configuration${versionString}`,
			successMessage = `Plugin ${pluginName} was successfully added${configuration ? successMessageForConfigSuffix : versionString}.`;

		if (configuration) {
			await this.$project.updateProjectProperty("set", CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins, [configuration]);
		} else {
			await this.$project.updateProjectProperty("set", CordovaProjectPluginsService.CORE_PLUGINS_PROPERTY_NAME, newCorePlugins);
		}

		this.$project.saveProject(this.$project.projectDir, this.$project.getAllConfigurationsNames());

		this.$logger.out(successMessage);
	}

	private removePluginCore(pluginName: string, plugin: IPlugin, configuration?: string): void {
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
				this.$project.saveProject(this.$project.getProjectDir(), [configuration]);
				this.$logger.out("Plugin %s was successfully removed for %s configuration.", pluginName, configuration);
			} else {
				this.$project.saveProject();
				this.$logger.out("Plugin %s was successfully removed.", pluginName);
			}
		}
	}

	private async createPluginsData(pluginsService: ICordovaPluginsService): Promise<void> {
		let plugins = await pluginsService.getAvailablePlugins();
		await Promise.all(_.map(plugins, async (plugin: IMarketplacePluginData) => {
			try {
				let data = await pluginsService.createPluginData(plugin);
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
		}));
	}

	private async gatherVariableInformation(pluginIdentifier: string, variableName: string, configuration: string): Promise<any> {
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

		return this.getPluginVariableFromVarOption(variableName, configuration) || await this.$prompter.get([schema]);
	}

	private async getPluginInstancesByName(pluginName: string, version?: string): Promise<IPlugin[]> {
		let plugins = await this.getAvailablePlugins();
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
		let obsoletedBy = await this.getObsoletedByPluginIdentifier(realIdentifier);
		if (obsoletedBy) {
			let obsoletedByPlugins = filterAction(obsoletedBy);
			matchingPlugins = matchingPlugins.concat(obsoletedByPlugins);
		}

		if (!matchingPlugins || !matchingPlugins.length) {
			this.$errors.fail("Invalid plugin name: %s", pluginName);
		}

		return matchingPlugins;
	}

	private async promptForVersion(pluginName: string, versions: any[]): Promise<string> {
		return await versions.length > 1 ? this.promptForVersionCore(pluginName, versions) : versions[0].value;
	}

	private async promptForVersionCore(pluginName: string, versions: any[]): Promise<string> {
		let version: string;
		if (helpers.isInteractive()) {
			version = await this.$prompter.promptForChoice("Which plugin version do you want to use?", versions);
		} else {
			this.$errors.failWithoutHelp(`You must specify valid version in order to update your plugin when terminal is not interactive.`);
		}

		return version;
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

	private async modifyInstalledMarketplacePlugin(pluginName: string, version: string): Promise<void> {
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
			selectedVersion = await this.selectPluginVersion(version, installedPlugin);
			await this.configurePlugin(pluginName, selectedVersion, this.$project.getAllConfigurationsNames());
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

			selectedVersion = await this.selectPluginVersion(version, installedPlugin, { excludeCurrentVersion: true });
			_.each(configurationsToEdit, async (selectedConfiguration: string) => await this.configurePluginCore(pluginName, selectedConfiguration, selectedVersion));
			return;
		}

		if (isConsoleInteractive) {
			let selectedItem = await this.$prompter.promptForChoice("Select action", choices);
			switch (selectedItem) {
				case removeItemChoice:
					selectedVersion = await this.selectPluginVersion(version, installedPlugin);
					_.each(configurationsToRemove, (configurationToRemove: string) => this.removePluginCore(pluginName, installedPlugin, configurationToRemove));
					_.each(this.specifiedConfigurations, async (selectedConfiguration: string) => await this.configurePluginCore(pluginName, selectedConfiguration, selectedVersion));
					break;
				case modifyAllConfigs:
					selectedVersion = await this.selectPluginVersion(version, installedPlugin);
					await this.configurePlugin(pluginName, selectedVersion, configurationsToEdit);
					break;
				default:
					this.$errors.failWithoutHelp("The operation will not be completed.");
			}
		} else {
			this.$errors.failWithoutHelp(`Plugin ${pluginName} is enabled in multiple configurations and you are trying to enable it in one only. You cannot do this in non-interactive terminal.`);
		}
	}

	private async selectPluginVersion(version: string, plugin: IPlugin, options?: { excludeCurrentVersion: boolean }): Promise<string> {
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
			version = await this.promptForVersion(pluginName, versions);
		}

		return version;
	}

	/**
	 * Gets the id of a plugin based on its name by checking all available plugins.
	 * This is required in case the plugin is renamed, but its plugin identifier has not been changed.
	 * @param {string} pluginName The plugin name that has to be checked.
	 * @returns {string} The id of the plugin if there's only one plugin identifier for the specified name.
	 * In case there are more than one ids for the specified name or there's no match, empty string is returned.
	 */
	private async getPluginIdFromName(pluginName: string): Promise<string> {
		let pluginNameToLowerCase = pluginName.toLowerCase();
		let matchingPluginIds = _(await this.getAvailablePlugins())
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

	private async getObsoletedByPluginIdentifier(pluginIdentifier: string): Promise<string> {
		let obsoletedByInfo = _.find(this.getObsoletedIntegratedPlugins(), (obsoletedPluginInfo: any, key: string) => key.toLowerCase() === pluginIdentifier.toLowerCase()) || Object.create(null);
		return obsoletedByInfo.obsoletedBy;
	}

	private async getObsoletingPluginIdentifier(pluginIdentifier: string): Promise<string> {
		let obsoletingKey: string;

		_.each(this.getObsoletedIntegratedPlugins(), (obsoletedPluginInfo: any, key: string) => {
			if (obsoletedPluginInfo.obsoletedBy.toLowerCase() === pluginIdentifier.toLowerCase()) {
				obsoletingKey = key;
				return false;
			}
		});

		return obsoletingKey;
	}

	private getLocalPlugins(): IPlugin[] {
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
					let basicPluginInfo = this.getLocalPluginBasicInformation(pluginXml);
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
	}

	private getLocalPluginBasicInformation(pluginXml: any): IBasicPluginInformation {
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
	}

	private getPluginXmlContent(pathToPlugin: string): any {
		let pathToPluginXml = path.join(pathToPlugin, "plugin.xml");

		if (!this.$fs.exists(pathToPluginXml)) {
			return null;
		}

		return xmlMapping.tojson(this.$fs.readText(pathToPluginXml));
	}

	private async setPluginVariables(pluginIdentifier: string, variables: string[], configuration: string): Promise<void> {
		let originalPluginVariables = this.$project.getProperty(CordovaProjectPluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration) || {};
		let cordovaPluginVariables: any = _.cloneDeep(originalPluginVariables);

		if (variables && variables.length > 0) {
			if (!cordovaPluginVariables[pluginIdentifier]) {
				cordovaPluginVariables[pluginIdentifier] = {};
			}

			await Promise.all(_.map(variables, async (variable: any) => {
				let variableName: string = variable.name || variable;
				let variableInformation = await this.gatherVariableInformation(pluginIdentifier, variableName, configuration);
				cordovaPluginVariables[pluginIdentifier][variableName] = variableInformation[variableName];
			}));
			this.$project.setProperty(CordovaProjectPluginsService.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, cordovaPluginVariables, configuration);
		}
	}
}

$injector.register("cordovaProjectPluginsService", CordovaProjectPluginsService);

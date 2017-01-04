import pluginsDataLib = require("./../../plugins-data");

export class AddPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $injector: IInjector,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
		if (this.$options.available) {
			let installedPlugins = await this.$pluginsService.getInstalledPlugins();
			let plugins = _.reject(await this.$pluginsService.getAvailablePlugins(), (plugin: IPlugin) => {
				if (plugin.type === pluginsDataLib.PluginType.MarketplacePlugin) {
					let marketPlacePlugin = <IMarketplacePlugin>plugin;
					let installedPlugin = _.find(installedPlugins, (installedPlugin: IPlugin) => installedPlugin.data.Name === plugin.data.Name && installedPlugin.data.Version === plugin.data.Version);
					if (installedPlugin) {
						if (marketPlacePlugin.pluginVersionsData.Versions.length > 1) {
							// reject installed version
							marketPlacePlugin.pluginVersionsData.Versions = <any>_.reject(marketPlacePlugin.pluginVersionsData.Versions, versionData => versionData.Version === installedPlugin.data.Version);
							let defaultVersion = (<any>marketPlacePlugin.pluginVersionsData).DefaultVersion;

							if (defaultVersion !== installedPlugin.data.Version) { // The default version is installed, we need to change DefaultVersion property
								marketPlacePlugin.data = <any>_.find(marketPlacePlugin.pluginVersionsData.Versions, versionData => versionData.Version === defaultVersion);
								(<any>marketPlacePlugin.pluginVersionsData).DefaultVersion = marketPlacePlugin.data.Version;
							}

							return false;
						}

						return true;
					}
				}

				return _.some(installedPlugins, (installedPlugin: IPlugin) => installedPlugin.data.Name === plugin.data.Name);
			});
			await this.$pluginsService.printPlugins(await this.$pluginsService.filterPlugins(plugins));
		} else {
			await this.$pluginsService.addPlugin(args[0]);
		}
	}

	public allowedParameters: ICommandParameter[] = [];

	public async canExecute(args: string[]): Promise<boolean> {
		if (this.$options.available) {
			return true;
		}

		let pluginName = args[0];
		// Use pluginCommandParameter's validate method for verification.
		let pluginCommandParameter: ICommandParameter = this.$injector.resolve(PluginCommandParameter);
		await pluginCommandParameter.validate(pluginName);

		return true;
	}
}

$injector.registerCommand("plugin|add", AddPluginCommand);

class PluginCommandParameter implements ICommandParameter {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

	public mandatory = true;

	public async validate(pluginName: string): Promise<boolean> {
		if (!pluginName) {
			this.$errors.fail("No plugin name specified");
		}

		return true;
	}
}

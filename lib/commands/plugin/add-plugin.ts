///<reference path="../../.d.ts"/>
"use strict";

import pluginsDataLib = require("./../../plugins-data");

export class AddPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
				private $injector: IInjector,
				private $options: IOptions) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(this.$options.available){
				let installedPlugins = this.$pluginsService.getInstalledPlugins();
				let plugins = _.reject(this.$pluginsService.getAvailablePlugins(), (plugin: IPlugin) => {
					if(plugin.type === pluginsDataLib.PluginType.MarketplacePlugin) {
						let marketPlacePlugin = <IMarketplacePlugin>plugin;
						let installedPlugin = _.find(installedPlugins, (installedPlugin: IPlugin) => installedPlugin.data.Name === plugin.data.Name && installedPlugin.data.Version === plugin.data.Version);
						if(installedPlugin) {
							if(marketPlacePlugin.pluginVersionsData.Versions.length > 1) {
								// reject installed version
								marketPlacePlugin.pluginVersionsData.Versions = <any>_.reject(marketPlacePlugin.pluginVersionsData.Versions, versionData => versionData.Version === installedPlugin.data.Version);
								let defaultVersion = (<any>marketPlacePlugin.pluginVersionsData).DefaultVersion;

								if(defaultVersion !== installedPlugin.data.Version) { // The default version is installed, we need to change DefaultVersion property
									marketPlacePlugin.data = _.find(marketPlacePlugin.pluginVersionsData.Versions, versionData => versionData.Version === defaultVersion);
									(<any>marketPlacePlugin.pluginVersionsData).DefaultVersion = marketPlacePlugin.data.Version;
								}
								return false;
							}
							return true;
						}
					}

					return _.any(installedPlugins, (installedPlugin: IPlugin) => installedPlugin.data.Name === plugin.data.Name);
				});
				this.$pluginsService.printPlugins(plugins);
			} else {
				this.$pluginsService.addPlugin(args[0]).wait();
			}
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(this.$options.available) {
				return true;
			}

			let pluginName = args[0];
			// Use pluginCommandParameter's validate method for verification.
			let pluginCommandParameter = this.$injector.resolve(PluginCommandParameter);
			pluginCommandParameter.validate(pluginName).wait();

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("plugin|add", AddPluginCommand);

class PluginCommandParameter implements ICommandParameter {
	constructor(private $pluginsService: IPluginsService,
				private $errors: IErrors) { }

	mandatory = true;

	validate(pluginName: string): IFuture<boolean> {
		return ((): boolean => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			return true;
		}).future<boolean>()();
	}
}

///<reference path="../../.d.ts"/>
"use strict";

import options = require("../../common/options");
import pluginsDataLib = require("./../../plugins-data");

export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var plugins = options.available ? this.$pluginsService.getAvailablePlugins() : this.$pluginsService.getInstalledPluginsEnabledAtLeastInOneConfiguration();
			if(options.available) {
				// Group marketplace plugins
				var marketplacePlugins = _.filter(plugins, (pl) => pl.type === pluginsDataLib.PluginType.MarketplacePlugin);
				var output = _.filter(plugins, pl => pl.type === pluginsDataLib.PluginType.CorePlugin || pl.type === pluginsDataLib.PluginType.AdvancedPlugin);

				var groups = _.groupBy(marketplacePlugins, (plugin: IPlugin) => plugin.data.Identifier);
				_.each(groups, (group: any) => {
					var defaultData = _.find(group, (gr: IPlugin) => {
						var pvd = (<any>gr).pluginVersionsData;
						return pvd && gr.data.Version === pvd.DefaultVersion;
					});
					if(defaultData) {
						output.push(defaultData);
					}
				});
				this.$pluginsService.printPlugins(output);
			} else {
				this.$pluginsService.printPlugins(plugins);
			}
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|*list", ListPluginCommand);
///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import PluginsServiceBaseLib = require("./plugins-service-base");

export class MarketplacePluginsService extends PluginsServiceBaseLib.PluginsServiceBase {
	private static MARKET_PLACE_PLUGINS_URL = "http://plugins.telerik.com/api/plugins";
	private identifierToPluginDictionary: IDictionary<IMarketplacePlugin>;

	constructor(private $httpClient: Server.IHttpClient,
		private $project: Project.IProject) {
		super();
		this.identifierToPluginDictionary = Object.create(null);
	}

	private getMarketplacePlugins(): IFuture<IMarketplacePlugin[]> {
		return (() => {
			if(_.keys(this.identifierToPluginDictionary).length === 0) {
				var req = this.$httpClient.httpRequest(MarketplacePluginsService.MARKET_PLACE_PLUGINS_URL).wait();
				var body = req.body;
				var plugins = JSON.parse(body);
				_.each(plugins, (plugin: any) => {
					var marketplacePlugin = new PluginsServiceBaseLib.MarketplacePluginData(plugin.title, plugin.uniqueId, plugin.pluginVersion, plugin.downloadsCount, plugin.repositoryUrl, plugin.demoAppRepositoryLink);
					this.identifierToPluginDictionary[plugin.uniqueId] = marketplacePlugin;
				});
			}

			return _.values(this.identifierToPluginDictionary);
		}).future<IMarketplacePlugin[]>()();
	}

	public getInstalledPlugins(): IFuture<IMarketplacePlugin[]> {
		return (() => {
			this.getMarketplacePlugins().wait();

			var plugins = _.filter(this.$project.projectData.CorePlugins, (pluginName: string) => this.isMarketplacePlugin(pluginName));
			return _.map(plugins, (plugin: string) => {
				return this.identifierToPluginDictionary[plugin.split("@")[0]];
			});

		}).future<IMarketplacePlugin[]>()();
	}

	public getAvailablePlugins(): IFuture<IMarketplacePlugin[]> {
		return this.getMarketplacePlugins();
	}

	public isMarketplacePlugin(pluginName: string): boolean {
		var pluginType = this.getPluginTypeByName(pluginName);
		return pluginType === PluginsServiceBaseLib.PluginType.MarketplacePlugin;
	}
}
$injector.register("marketplacePluginsService", MarketplacePluginsService);
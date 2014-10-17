///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import PluginsDataLib = require("./../plugins-data");

export class MarketplacePluginsService implements ICordovaPluginsService {
	private static MARKET_PLACE_PLUGINS_URL = "http://plugins.telerik.com/api/plugins";
	private identifierToPluginDictionary: IDictionary<IMarketplacePlugin>;

	constructor(private $httpClient: Server.IHttpClient,
		private $project: Project.IProject) {
		this.identifierToPluginDictionary = Object.create(null);
	}

	public getAvailablePlugins(): IFuture<IMarketplacePlugin[]> {
		return (() => {
			if(_.keys(this.identifierToPluginDictionary).length === 0) {
				var req = this.$httpClient.httpRequest(MarketplacePluginsService.MARKET_PLACE_PLUGINS_URL).wait();
				var body = req.body;
				var plugins = JSON.parse(body);
				_.each(plugins, (plugin: any) => {
					var marketplacePlugin = new PluginsDataLib.MarketplacePluginData(plugin.title, plugin.uniqueId, plugin.pluginVersion, plugin.downloadsCount, plugin.repositoryUrl, plugin.demoAppRepositoryLink);
					this.identifierToPluginDictionary[plugin.uniqueId] = marketplacePlugin;
				});
			}

			return _.values(this.identifierToPluginDictionary);
		}).future<IMarketplacePlugin[]>()();
	}

	public getInstalledPlugins(): IFuture<IMarketplacePlugin[]> {
		return (() => {
			var plugins = _.filter(this.$project.projectData.CorePlugins, (pluginName: string) => this.isMarketplacePlugin(pluginName.split("@")[0]).wait());
			return _.map(plugins, (plugin: string) => {
				return this.identifierToPluginDictionary[plugin.split("@")[0]];
			});

		}).future<IMarketplacePlugin[]>()();
	}

	public isMarketplacePlugin(pluginName: string): IFuture<boolean> {
		return (() => {
			pluginName = pluginName.toLowerCase();
			return _.any(this.getAvailablePlugins().wait(), p => p.identifier.toLowerCase() === pluginName);
		}).future<boolean>()();
	}
}
$injector.register("marketplacePluginsService", MarketplacePluginsService);
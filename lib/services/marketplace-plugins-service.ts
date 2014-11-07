///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import PluginsDataLib = require("./../plugins-data");

export class MarketplacePluginsService implements ICordovaPluginsService {
	private static MARKET_PLACE_PLUGINS_URL = "http://plugins.telerik.com/api/plugins";

	constructor(private $httpClient: Server.IHttpClient,
		private $server: Server.IServer) { }

	public getAvailablePlugins(): IFuture<any> {
		return (() => {
			return JSON.parse(this.$httpClient.httpRequest(MarketplacePluginsService.MARKET_PLACE_PLUGINS_URL).wait().body);
		}).future<any>()();
	}

	public createPluginData(plugin: any): IFuture<IMarketplacePlugin> {
		return (() => {
			var rowPluginData = this.$server.cordova.getMarketplacePluginData(plugin.uniqueId, plugin.pluginVersion).wait();
			return new PluginsDataLib.MarketplacePluginData(
				rowPluginData.Name,
				rowPluginData.Identifier,
				rowPluginData.Version,
				rowPluginData.Description,
				rowPluginData.Url,
				rowPluginData.Variables,
				rowPluginData.Platforms,
				plugin.downloadsCount,
				plugin.demoAppRepositoryLink);
		}).future<IMarketplacePlugin>()();
	}
}
$injector.register("marketplacePluginsService", MarketplacePluginsService);
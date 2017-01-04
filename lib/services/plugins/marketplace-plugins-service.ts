import * as PluginsDataLib from "../../plugins-data";

export class MarketplacePluginsService implements ICordovaPluginsService {

	constructor(private $server: Server.IServer,
		private $project: Project.IProject,
		private $projectConstants: Project.IConstants) { }

	public async getAvailablePlugins(): Promise<any> {
		return this.$server.cordova.getMarketplacePluginsData(this.$project.projectData.Framework);
	}

	public async createPluginData(plugin: IMarketplacePluginVersionsDataBase): Promise<IPlugin[]> { // DefaultVersion, Identifier, Versions
		return _.map(plugin.Versions, (pluginVersionData) => new PluginsDataLib.MarketplacePluginData(plugin, pluginVersionData, this.$project, this.$projectConstants));
	}
}

$injector.register("marketplacePluginsService", MarketplacePluginsService);

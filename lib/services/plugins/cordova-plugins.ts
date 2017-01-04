import { CordovaPluginData, PluginType } from "./../../plugins-data";

export class CordovaPluginsService implements ICordovaPluginsService {
	constructor(private $project: Project.IProject,
		private $fs: IFileSystem,
		private $config: IConfiguration,
		private $server: Server.IServer,
		private $projectConstants: Project.IConstants,
		private $resources: IResourceLoader,
		private $cordovaResources: ICordovaResourceLoader) { }

	// HACK: Information for this plugin is never returned from the server, so keep it here.
	// TODO: Remove the LivePatch HACK when the server returns correct results.
	// HACK: Platforms should be Server.DevicePlatform.Android, etc. but this fails at runtime that Server is not defined.
	// 		 That's why the plugin type is declared as any insted of Server.CordovaPluginData
	private livePatchPlugin: any = {
		"Name": "Telerik AppManager LiveSync",
		"Identifier": "com.telerik.LivePatch",
		"Version": "1.0.0",
		"Description": "This plugin adds Telerik AppManager LiveSync functionality",
		"Url": "",
		"Assets": [],
		"Platforms": ["Android", "iOS", "WP8"],
		"Variables": [],
		"AndroidRequiredPermissions": ["android.permission.INTERNET"]
	};

	public async getAvailablePlugins(): Promise<Server.CordovaPluginData[]> {
		await this.$project.ensureCordovaProject();
		// TODO: Remove the LivePatch HACK when the server returns correct results. Also check the tests.
		return await this.$server.cordova.getPlugins(this.$project.projectData.FrameworkVersion).concat([this.livePatchPlugin]);
	}

	public async createPluginData(plugin: IMarketplacePluginData): Promise<IPlugin[]> {
		await this.$project.ensureCordovaProject();
		return [new CordovaPluginData(plugin, this.getPluginTypeByIdentifier(plugin.Identifier), this.$project, this.$projectConstants)];
	}

	private getPluginTypeByIdentifier(pluginIdentifier: string): PluginType {
		let pluginType = PluginType.AdvancedPlugin;
		let corePluginRegex = this.$cordovaResources.getCordovaMigrationData().corePluginRegex;
		let isCorePlugin = new RegExp(corePluginRegex).test(pluginIdentifier);
		if (isCorePlugin) {
			pluginType = PluginType.CorePlugin;
		}

		return pluginType;
	}
}

$injector.register("cordovaPluginsService", CordovaPluginsService);

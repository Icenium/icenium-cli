export class PluginsService implements IPluginsService {
	private frameworkProject: Project.IFrameworkProject;

	constructor(private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $loginManager: ILoginManager,
		private $project: Project.IProject) { }

	public async getAvailablePlugins(pluginsCount?: number): Promise<IPlugin[]> {
		return (await this.getPluginsService()).getAvailablePlugins(pluginsCount);
	}

	public async getInstalledPlugins(): Promise<IPlugin[]> {
		return (await this.getPluginsService()).getInstalledPlugins();
	}

	public async printPlugins(plugins: IPlugin[]): Promise<void> {
		(await this.getPluginsService()).printPlugins(plugins);
	}

	public async addPlugin(pluginName: string): Promise<void> {
			await this.getPluginsService().wait().addPlugin(pluginName);
	}

	public async removePlugin(pluginName: string): Promise<void> {
			await this.getPluginsService().wait().removePlugin(pluginName);
	}

	public async configurePlugin(pluginName: string, version?: string, configurations?: string[]): Promise<void> {
			await this.getPluginsService().wait().configurePlugin(pluginName, version, configurations);
	}

	public async isPluginInstalled(pluginName: string): Promise<boolean> {
		return (await this.getPluginsService()).isPluginInstalled(pluginName);
	}

	public async getPluginBasicInformation(pluginName: string): Promise<IBasicPluginInformation> {
		return (await this.getPluginsService()).getPluginBasicInformation(pluginName);
	}

	public async findPlugins(keywords: string[]): Promise<IPluginsSource> {
		return (await this.getPluginsService()).findPlugins(keywords);
	}

	public async fetch(pluginIdentifier: string): Promise<string> {
		return (await this.getPluginsService()).fetch(pluginIdentifier);
	}

	public async filterPlugins(plugins: IPlugin[]): Promise<IPlugin[]> {
		return (await this.getPluginsService()).filterPlugins(plugins);
	}

	private async getPluginsService(): Promise<IPluginsService> {
			if (!this.frameworkProject) {
				await this.$loginManager.ensureLoggedIn();
				this.$project.ensureProject();
				this.frameworkProject = this.$frameworkProjectResolver.resolve(this.$project.projectData.Framework);
				return this.frameworkProject.pluginsService;
			}
			return this.frameworkProject.pluginsService;
	}
}
$injector.register("pluginsService", PluginsService);

export class PluginsService implements IPluginsService {
	private frameworkProject: Project.IFrameworkProject;

	constructor(private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $loginManager: ILoginManager,
		private $project: Project.IProject) { }

	public getAvailablePlugins(pluginsCount?: number): IPlugin[] {
		return this.getPluginsService().wait().getAvailablePlugins(pluginsCount);
	}

	public getInstalledPlugins(): IPlugin[] {
		return this.getPluginsService().wait().getInstalledPlugins();
	}

	public printPlugins(plugins: IPlugin[]): void {
		this.getPluginsService().wait().printPlugins(plugins);
	}

	public async addPlugin(pluginName: string): Promise<void> {
			this.getPluginsService().wait().addPlugin(pluginName).wait();
	}

	public async removePlugin(pluginName: string): Promise<void> {
			this.getPluginsService().wait().removePlugin(pluginName).wait();
	}

	public async configurePlugin(pluginName: string, version?: string, configurations?: string[]): Promise<void> {
			this.getPluginsService().wait().configurePlugin(pluginName, version, configurations).wait();
	}

	public isPluginInstalled(pluginName: string): boolean {
		return this.getPluginsService().wait().isPluginInstalled(pluginName);
	}

	public getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation> {
		return this.getPluginsService().wait().getPluginBasicInformation(pluginName);
	}

	public findPlugins(keywords: string[]): IFuture<IPluginsSource> {
		return this.getPluginsService().wait().findPlugins(keywords);
	}

	public async fetch(pluginIdentifier: string): Promise<string> {
			return this.getPluginsService().wait().fetch(pluginIdentifier).wait();
	}

	public filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]> {
		return this.getPluginsService().wait().filterPlugins(plugins);
	}

	private async getPluginsService(): Promise<IPluginsService> {
			if (!this.frameworkProject) {
				this.$loginManager.ensureLoggedIn().wait();
				this.$project.ensureProject();
				this.frameworkProject = this.$frameworkProjectResolver.resolve(this.$project.projectData.Framework);
				return this.frameworkProject.pluginsService;
			}
			return this.frameworkProject.pluginsService;
	}
}
$injector.register("pluginsService", PluginsService);

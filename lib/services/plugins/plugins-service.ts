export class PluginsService implements IPluginsService {
	private frameworkProject: Project.IFrameworkProject;

	constructor(private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $loginManager: ILoginManager,
		private $project: Project.IProject) { }

	public getAvailablePlugins(pluginsCount?: number): IPlugin[] {
		await return this.getPluginsService().getAvailablePlugins(pluginsCount);
	}

	public getInstalledPlugins(): IPlugin[] {
		await return this.getPluginsService().getInstalledPlugins();
	}

	public printPlugins(plugins: IPlugin[]): void {
		await this.getPluginsService().printPlugins(plugins);
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

	public isPluginInstalled(pluginName: string): boolean {
		await return this.getPluginsService().isPluginInstalled(pluginName);
	}

	public getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation> {
		await return this.getPluginsService().getPluginBasicInformation(pluginName);
	}

	public findPlugins(keywords: string[]): IFuture<IPluginsSource> {
		await return this.getPluginsService().findPlugins(keywords);
	}

	public async fetch(pluginIdentifier: string): Promise<string> {
			await return this.getPluginsService().wait().fetch(pluginIdentifier);
	}

	public filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]> {
		await return this.getPluginsService().filterPlugins(plugins);
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

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

	public addPlugin(pluginName: string): IFuture<void> {
		return (() => {
			this.getPluginsService().wait().addPlugin(pluginName).wait();
		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			this.getPluginsService().wait().removePlugin(pluginName).wait();
		}).future<void>()();
	}

	public configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void> {
		return (() => {
			this.getPluginsService().wait().configurePlugin(pluginName, version, configurations).wait();
		}).future<void>()();
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

	public fetch(pluginIdentifier: string): IFuture<void> {
		return (() => {
			return this.getPluginsService().wait().fetch(pluginIdentifier).wait();
		}).future<void>()();
	}

	public filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]> {
		return this.getPluginsService().wait().filterPlugins(plugins);
	}

	private getPluginsService(): IFuture<IPluginsService> {
		return ((): IPluginsService => {
			if (!this.frameworkProject) {
				this.$loginManager.ensureLoggedIn().wait();
				this.$project.ensureProject();
				this.frameworkProject = this.$frameworkProjectResolver.resolve(this.$project.projectData.Framework);
				return this.frameworkProject.pluginsService;
			}
			return this.frameworkProject.pluginsService;
		}).future<IPluginsService>()();
	}
}
$injector.register("pluginsService", PluginsService);

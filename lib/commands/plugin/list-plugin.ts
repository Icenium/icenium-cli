export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
		let plugins = this.$options.available ? await this.$pluginsService.getAvailablePlugins(this.$options.count) : await this.$pluginsService.getInstalledPlugins();
		await this.$pluginsService.printPlugins(await this.$pluginsService.filterPlugins(plugins));
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("plugin|*list", ListPluginCommand);

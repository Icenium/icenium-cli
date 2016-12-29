export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
			let plugins = this.$options.available ? this.$pluginsService.getAvailablePlugins(this.$options.count) : this.$pluginsService.getInstalledPlugins();
			await this.$pluginsService.printPlugins(this.$pluginsService.filterPlugins(plugins));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|*list", ListPluginCommand);

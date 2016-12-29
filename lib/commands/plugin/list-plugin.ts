export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $options: IOptions) { }

	public async execute(args: string[]): Promise<void> {
			let plugins = this.$options.available ? this.$pluginsService.getAvailablePlugins(this.$options.count) : this.$pluginsService.getInstalledPlugins();
			this.$pluginsService.printPlugins(this.$pluginsService.filterPlugins(plugins).wait());
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|*list", ListPluginCommand);

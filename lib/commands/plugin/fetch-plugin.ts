export class FetchPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $stringParameter: ICommandParameter) { }

	public allowedParameters = [this.$stringParameter];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let pluginName = this.$pluginsService.fetch(args[0]).wait();

			this.$logger.printMarkdown(`Successfully fetched plugin \`${pluginName}\``);
		}).future<void>()();
	}
}
$injector.registerCommand("plugin|fetch", FetchPluginCommand);

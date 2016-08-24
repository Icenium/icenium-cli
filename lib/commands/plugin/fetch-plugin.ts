export class FetchPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $progressIndicator: IProgressIndicator,
		private $stringParameter: ICommandParameter) { }

	public allowedParameters = [this.$stringParameter];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let fetchFuture = this.$pluginsService.fetch(args[0]);

			this.$logger.printInfoMessageOnSameLine("Searching for plugins, please wait.");

			this.$progressIndicator.showProgressIndicator(fetchFuture, 2000).wait();

			this.$logger.printMarkdown(`Successfully fetched plugin \`${fetchFuture.get()}\``);
		}).future<void>()();
	}
}
$injector.registerCommand("plugin|fetch", FetchPluginCommand);

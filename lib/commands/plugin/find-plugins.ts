export class FindPluginsCommand implements ICommand {
	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $options: IOptions,
		private $printPluginsService: IPrintPluginsService,
		private $pluginsService: IPluginsService) { }

	public allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (!args.length) {
				this.$errors.fail("You have to provide all required parameters.");
			}
			return true;
		}).future<boolean>()();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let pluginsSource = this.$pluginsService.findPlugins(args).wait();
			this.$printPluginsService.printPlugins(pluginsSource, { showAllPlugins: this.$options.all }).wait();
		}).future<void>()();
	}
}

$injector.registerCommand("plugin|find", FindPluginsCommand);

export class FindPluginsCommand implements ICommand {
	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $options: IOptions,
		private $printPluginsService: IPrintPluginsService,
		private $pluginsService: IPluginsService) { }

	public allowedParameters: ICommandParameter[] = [];

	public async canExecute(args: string[]): Promise<boolean> {
			if (!args.length) {
				this.$errors.fail("You have to provide all required parameters.");
			}
			return true;
	}

	public async execute(args: string[]): Promise<void> {
			let pluginsSource = this.$pluginsService.findPlugins(args).wait();
			this.$printPluginsService.printPlugins(pluginsSource, { showAllPlugins: this.$options.all }).wait();
	}
}

$injector.registerCommand("plugin|find", FindPluginsCommand);

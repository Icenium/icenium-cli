export class FindPluginsCommand implements ICommand {
	constructor(private $errors: IErrors,
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
		let pluginsSource = await this.$pluginsService.findPlugins(args);
		await this.$printPluginsService.printPlugins(pluginsSource, { showAllPlugins: this.$options.all });
	}
}

$injector.registerCommand("plugin|find", FindPluginsCommand);

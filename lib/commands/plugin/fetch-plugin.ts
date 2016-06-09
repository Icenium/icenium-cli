export class FetchPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
				private $stringParameter: ICommandParameter) {}

	public allowedParameters = [this.$stringParameter];

	public execute(args: string[]): IFuture<void> {
		return this.$pluginsService.fetch(args[0]);
	}
}
$injector.registerCommand("plugin|fetch", FetchPluginCommand);

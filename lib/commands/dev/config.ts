export class DevConfigCommand implements ICommand {
	allowedParameters: ICommandParameter[];

	constructor(private $config: IConfiguration) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			return this.$config.printConfigData();
		}).future<void>()();
	}
}
$injector.registerCommand("dev-config", DevConfigCommand);

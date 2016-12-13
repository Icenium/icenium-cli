export class DevConfigResetCommand implements ICommand {
	constructor(private $config: IConfiguration) { }

	public allowedParameters: ICommandParameter[] = [];

	public disableAnalytics = true;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$config.reset();
		}).future<void>()();
	}
}
$injector.registerCommand("dev-config-reset", DevConfigResetCommand);

export class DevConfigResetCommand implements ICommand {
	constructor(private $config: IConfiguration) { }

	public allowedParameters: ICommandParameter[] = [];

	public disableAnalytics = true;

	public async execute(args: string[]): Promise<void> {
			this.$config.reset();
	}
}
$injector.registerCommand("dev-config-reset", DevConfigResetCommand);

export class DevConfigCommand implements ICommand {
	allowedParameters: ICommandParameter[];

	constructor(private $config: IConfiguration) { }

	public async execute(args: string[]): Promise<void> {
			return this.$config.printConfigData();
	}
}
$injector.registerCommand("dev-config", DevConfigCommand);

export class DevConfigCommand implements ICommand {
	public allowedParameters: ICommandParameter[];

	constructor(private $config: IConfiguration) { }

	public async execute(args: string[]): Promise<void> {
		await this.$config.printConfigData();
	}
}

$injector.registerCommand("dev-config", DevConfigCommand);

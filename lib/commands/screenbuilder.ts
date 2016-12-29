export class ScreenBuilderCommand implements ICommand {

	constructor(private $logger: ILogger,
		private $commandsService: ICommandsService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$commandsService.tryExecuteCommand("help", ["screenbuilder"]);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("screenbuilder", ScreenBuilderCommand);

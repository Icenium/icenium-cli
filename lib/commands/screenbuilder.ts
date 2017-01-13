export class ScreenBuilderCommand implements ICommand {
	constructor(private $commandsService: ICommandsService) { }

	public async execute(args: string[]): Promise<void> {
		return this.$commandsService.tryExecuteCommand("help", ["screenbuilder"]);
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("screenbuilder", ScreenBuilderCommand);

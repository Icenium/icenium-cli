export class ScreenBuilderCommand implements ICommand {
	constructor(private $commandsService: ICommandsService,
		private $screenBuilderService: IScreenBuilderService) { }

	public async execute(args: string[]): Promise<void> {
		this.$screenBuilderService.printDeprecationWarning();
		return this.$commandsService.tryExecuteCommand("help", ["screenbuilder"]);
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("screenbuilder", ScreenBuilderCommand);

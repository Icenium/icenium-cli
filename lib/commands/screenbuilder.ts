///<reference path="../.d.ts"/>
"use strict";

export class ScreenBuilderCommand implements ICommand {

	constructor(private $logger: ILogger,
		private $commandsService: ICommandsService) { }

	public execute(args: string[]): IFuture<void> {
		return this.$commandsService.tryExecuteCommand("help", ["screenbuilder"]);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("screenbuilder", ScreenBuilderCommand);
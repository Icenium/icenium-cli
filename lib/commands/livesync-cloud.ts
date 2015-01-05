///<reference path="../.d.ts"/>
"use strict";

export class ImportProjectCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return	this.$buildService.importProject();
	}
}
$injector.registerCommand("livesync|cloud", ImportProjectCommand);
$injector.registerCommand("live-sync|cloud", ImportProjectCommand);
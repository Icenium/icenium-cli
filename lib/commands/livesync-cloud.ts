///<reference path="../.d.ts"/>
"use strict";

export class ImportProjectCommand implements ICommand {
	constructor(private $project: Project.IProject) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return	this.$project.importProject();
	}
}
$injector.registerCommand("livesync|cloud", ImportProjectCommand);
$injector.registerCommand("live-sync|cloud", ImportProjectCommand);
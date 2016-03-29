///<reference path="../.d.ts"/>
"use strict";

import { EnsureProjectCommand } from "./ensure-project-command";

export class ImportProjectCommand extends EnsureProjectCommand {
	constructor($project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return	this.$project.importProject();
	}
}
$injector.registerCommand("livesync|cloud", ImportProjectCommand);
$injector.registerCommand("live-sync|cloud", ImportProjectCommand);

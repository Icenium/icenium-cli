///<reference path="../../.d.ts"/>
"use strict";

import ProjectCommandBaseLib = require("./project-command-base");

export class CreateProjectCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor($errors: IErrors,
		private frameworkIdentifier: string,
		private $nameCommandParameter: ICommandParameter,
		$project: Project.IProject) {
		super($errors, $project);
	}

	public execute(args: string[]): IFuture<void> {
		return this.$project.createNewProject(args[0], this.frameworkIdentifier);
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return this.canExecuteCore();
	}

	allowedParameters = [this.$nameCommandParameter];
}
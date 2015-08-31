///<reference path="../../.d.ts"/>
"use strict";
import * as ProjectCommandBaseLib from "./project-command-base";

export class CreateProjectCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor($errors: IErrors,
		private frameworkIdentifier: string,
		private $nameCommandParameter: ICommandParameter,
		$project: Project.IProject) {
		super($errors, $project);
	}

	public execute(args: string[]): IFuture<void> {
		this.validateProjectData();
		return this.$project.createNewProject(args[0], this.frameworkIdentifier);
	}

	allowedParameters = [this.$nameCommandParameter];
}

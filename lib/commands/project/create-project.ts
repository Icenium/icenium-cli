///<reference path="../../.d.ts"/>
"use strict";

export class CreateProjectCommand implements ICommand {
	constructor(private frameworkIdentifier: string,
		private $nameCommandParameter: ICommandParameter,
		private $project: Project.IProject) { }

	public execute(args: string[]): IFuture<void> {
		return this.$project.createNewProject(args[0], this.frameworkIdentifier);
	}

	allowedParameters = [this.$nameCommandParameter];
}
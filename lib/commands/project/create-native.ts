///<reference path="../../.d.ts"/>
"use strict";

import ProjectCommandBaseLib = require("./project-command-base");

export class CreateNativeCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor($errors: IErrors,
		$project: Project.IProject,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants,
		private $nameCommandParameter: ICommandParameter) {
		super($project, $errors, $logger);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createNewProject(args[0], this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
	}

	allowedParameters = [this.$nameCommandParameter];
}
$injector.registerCommand("create|native", CreateNativeCommand);
///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import options = require("./../../options");
import util = require("util");

export class CreateCommand implements ICommand {
	constructor(public $project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $screenBuilderService: IScreenBuilderService) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$screenBuilderService.prepareAndGeneratePrompt(this.$screenBuilderService.generatorName).wait();
			this.$screenBuilderService.installAppDependencies().wait();

			this.$project.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("create|*default", CreateCommand);
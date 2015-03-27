///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import ProjectCommandBaseLib = require("./project-command-base");
import path = require("path");
import options = require("./../../options");
import util = require("util");

export class CreateCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	private static GENERATOR_NAME = "generator-kendo-ui-mobile";

	constructor(public $project: Project.IProject,
		public $errors: IErrors,
		public $logger: ILogger,
		private $projectConstants: Project.IProjectConstants,
		private $screenBuilderService: IScreenBuilderService) {
		super($project, $errors, $logger);
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$screenBuilderService.prepareAndGeneratePrompt(CreateCommand.GENERATOR_NAME).wait();
			this.$screenBuilderService.installAppDependencies().wait();

			this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("create|*default", CreateCommand);
///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import options = require("./../../common/options");
import util = require("util");

import ProjectCommandBaseLib = require("./project-command-base");

export class CreateCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor($errors: IErrors,
		private $fs: IFileSystem,
		private $nameCommandParameter: ICommandParameter,
		$project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $screenBuilderService: IScreenBuilderService) {
		super($errors, $project);
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.validateProjectData();

			var projectName = args[0];
			var projectPath = path.resolve(options.path ? this.$project.getNewProjectDir() : path.join(this.$project.getNewProjectDir(), projectName));

			this.$project.createTemplateFolder(projectPath).wait();

			var screenBuilderOptions = {
				projectPath: projectPath,
				answers: {
					name: projectName
				}
			};

			try {
				this.$screenBuilderService.prepareAndGeneratePrompt(this.$screenBuilderService.generatorName, screenBuilderOptions).wait();
				this.$screenBuilderService.installAppDependencies(screenBuilderOptions).wait();

				this.$project.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova, projectPath).wait();
			} catch(err) {
				this.$fs.deleteDirectory(projectPath).wait();
				throw err;
			}
		}).future<void>()();
	}

	allowedParameters = [this.$nameCommandParameter];
}
$injector.registerCommand("create|*default", CreateCommand);
$injector.registerCommand("create|screenbuilder", CreateCommand);

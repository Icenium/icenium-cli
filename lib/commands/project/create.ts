///<reference path="../../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");

import ProjectCommandBaseLib = require("./project-command-base");

export class CreateCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor($errors: IErrors,
		private $fs: IFileSystem,
		private $nameCommandParameter: ICommandParameter,
		$project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $simulatorService: ISimulatorService,
		private $screenBuilderService: IScreenBuilderService,
		private $options: IOptions) {
		super($errors, $project);
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.validateProjectData();

			let projectName = args[0];
			let projectPath = path.resolve(this.$options.path ? this.$project.getNewProjectDir() : path.join(this.$project.getNewProjectDir(), projectName));

			this.$project.createTemplateFolder(projectPath).wait();

			let screenBuilderOptions = this.$screenBuilderService.composeScreenBuilderOptions({
				projectPath: projectPath,
				answers: {
					name: projectName
				}
			}).wait();
			
			try {
				this.$screenBuilderService.prepareAndGeneratePrompt(this.$screenBuilderService.generatorName, screenBuilderOptions).wait();
				this.$screenBuilderService.installAppDependencies(screenBuilderOptions).wait();

				this.$project.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova, projectPath, projectName).wait();
			} catch(err) {
				this.$fs.deleteDirectory(projectPath).wait();
				throw err;
			}
			
			if (this.$options.simulator) {
				this.$simulatorService.launchSimulator().wait();
			}
		}).future<void>()();
	}

	allowedParameters = [this.$nameCommandParameter];
}
$injector.registerCommand("create|*default", CreateCommand);
$injector.registerCommand("create|screenbuilder", CreateCommand);

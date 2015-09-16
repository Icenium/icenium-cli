///<reference path="../../.d.ts"/>
"use strict";
import * as path from "path";

import ProjectCommandBaseLib = require("./project-command-base");

export class CreateCommand extends ProjectCommandBaseLib.ProjectCommandBase {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $nameCommandParameter: ICommandParameter,
		private $options: IOptions,
		private $projectConstants: Project.IProjectConstants,
		private $screenBuilderService: IScreenBuilderService,
		private $simulatorService: ISimulatorService,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		$errors: IErrors,
		$project: Project.IProject) {
		super($errors, $project);
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.validateProjectData();

			let projectName = args[0];
			let projectPath = path.resolve(this.$options.path ? this.$project.getNewProjectDir() : path.join(this.$project.getNewProjectDir(), projectName));

			this.$project.createTemplateFolder(projectPath).wait();

			let screenBuilderOptions = this.$screenBuilderService.composeScreenBuilderOptions(this.$options.answers, {
				projectPath: projectPath,
				answers: {
					name: projectName
				}
			}).wait();

			try {
				this.$screenBuilderService.prepareAndGeneratePrompt(this.$screenBuilderService.generatorName, this.$options.path, screenBuilderOptions).wait();
				this.$screenBuilderService.installAppDependencies(screenBuilderOptions, this.$options.path).wait();

				this.$project.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova, projectPath, projectName).wait();
			} catch(err) {
				this.$logger.trace(err);
				this.$fs.deleteDirectory(projectPath).wait();
				throw err;
			}

			if (this.$options.simulator && this.$simulatorPlatformServices.canRunApplication && this.$simulatorPlatformServices.canRunApplication().wait()) {
				this.$simulatorService.launchSimulator().wait();
			}
		}).future<void>()();
	}

	allowedParameters = [this.$nameCommandParameter];
}
$injector.registerCommand("create|*default", CreateCommand);
$injector.registerCommand("create|screenbuilder", CreateCommand);

///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import path = require("path");
import helpers = require("../helpers");
import unzip = require("unzip");
var options: any = require("../options");
import projectTypes = require("../project-types");

class ProjectIdCommandParameter implements ICommandParameter {
	constructor(private $remoteProjectService: IRemoteProjectService) { }
	mandatory = true;

	validate(validationValue?: string): IFuture<boolean> {
		return (() => {
			if(validationValue) {
				var realProjectName = this.$remoteProjectService.getProjectName(validationValue.toString()).wait();
				if(realProjectName) {
					return true;
				}
			}

			return false;
		}).future<boolean>()();
	}
}

export class CloudListProjectsCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $remoteProjectService: IRemoteProjectService) { }

	allowedParameters: ICommandParameter[] = [];

	private printProjects(projects: any) {
		this.$logger.out("Projects:");
		projects.forEach((project: any, index: number) => {
			this.$logger.out("%s: '%s'", (index + 1).toString(), project.name);
		});
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			var data = this.$remoteProjectService.getProjects().wait();
			this.printProjects(data);
		}).future<void>()();
	}
}
$injector.registerCommand("cloud|*list", CloudListProjectsCommand);

export class CloudExportProjectsCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $server: Server.IServer,
		private $fs: IFileSystem,
		private $project: Project.IProject,
		private $errors: IErrors,
		private $remoteProjectService: IRemoteProjectService) { }

	allowedParameters: ICommandParameter[] = [new ProjectIdCommandParameter(this.$remoteProjectService)];

	execute(args: string[]): IFuture<void> {
		return (() => {
			var name = this.$remoteProjectService.getProjectName(args[0]).wait();
			this.doExportRemoteProject(name).wait();
		}).future<void>()();
	}

	private doExportRemoteProject(remoteProjectName: string): IFuture<void> {
		return (() => {
			var projectDir = path.join(this.$project.getNewProjectDir(), remoteProjectName);
			if(this.$fs.exists(projectDir).wait()) {
				this.$errors.fail("The folder %s already exists!", projectDir);
			}

			var projectExtractor = unzip.Extract({ path: projectDir });
			this.$remoteProjectService.makeTapServiceCall(() => this.$server.projects.getExportedSolution(remoteProjectName, false, projectExtractor)).wait();
			this.$fs.futureFromEvent(projectExtractor, "close").wait();

			try {
				// if there is no .abproject when exporting, we must be dealing with a cordova project, otherwise everything is set server-side
				var projectFile = path.join(projectDir, this.$project.PROJECT_FILE);
				if(!this.$fs.exists(projectFile).wait()) {
					var properties = this.$remoteProjectService.getProjectProperties(remoteProjectName).wait();
					this.$project.createProjectFile(projectDir, projectTypes.Cordova, properties).wait();
				}
			}
			catch(e) {
				this.$logger.warn("Couldn't create project file: %s", e.message);
			}

			this.$logger.info("%s has been successfully exported to %s", remoteProjectName, projectDir);
		}).future<void>()();
	}
}
$injector.registerCommand("cloud|export", CloudExportProjectsCommand);

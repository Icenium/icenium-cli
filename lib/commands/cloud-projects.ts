///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import path = require("path");
import helpers = require("../helpers");
import unzip = require("unzip");
import temp = require("temp");
import commonHelpers = require("../common/helpers");

class SolutionIdCommandParameter implements ICommandParameter {
	constructor(private $remoteProjectService: IRemoteProjectService) { }
	mandatory = false;

	validate(validationValue?: string): IFuture<boolean> {
		return (() => {
			if(validationValue) {
				this.$remoteProjectService.getSolutionName(validationValue).wait();
				return true;
			}

			return false;
		}).future<boolean>()();
	}
}

export class CloudListProjectsCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $remoteProjectService: IRemoteProjectService,
		private $prompter: IPrompter,
		private $errors: IErrors) { }

	allowedParameters: ICommandParameter[] = [new SolutionIdCommandParameter(this.$remoteProjectService)];

	private printList(solutionName: string, list: Server.IWorkspaceItemData[]): void {
		let headers =  ["#", "Project Name"];
		let data = list.map((proj: Server.IWorkspaceItemData, index: number) => [(++index).toString(), proj.Name]);
		let table = commonHelpers.createTable(headers, data);
		this.$logger.out(`Projects for ${solutionName} solution:`);
		this.$logger.out(table.toString());
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			let projects: Server.IWorkspaceItemData[];
			
			let slnName: string;
			if(args[0]) {
				slnName = this.$remoteProjectService.getSolutionName(args[0]).wait();
			} else {
				let solutions = this.$remoteProjectService.getSolutions().wait().map(sln => sln.name);
				slnName = this.$prompter.promptForChoice("Select solution for which to list projects:", solutions).wait();
			}
			projects = this.$remoteProjectService.getProjectsForSolution(slnName).wait();
			this.printList(slnName, projects);
		}).future<void>()();
	}
}
$injector.registerCommand("cloud|*list", CloudListProjectsCommand);

export class CloudExportProjectsCommand implements ICommand {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $remoteProjectService: IRemoteProjectService,
		private $server: Server.IServer,
		private $prompter: IPrompter,
		private $userDataStore: IUserDataStore) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let projectName: string;
			let slnName: string;
			if(args[0]) {
				slnName = this.$remoteProjectService.getSolutionName(args[0]).wait();
			} else {
				let solutions = this.$remoteProjectService.getSolutions().wait().map(sln => sln.name);
				slnName = this.$prompter.promptForChoice("Select solution for which to list projects:",solutions).wait();
			}
			
			if(args[1]) {
				projectName = this.$remoteProjectService.getProjectName(slnName, args[1]).wait();
			} else {
				let projectNames = this.$remoteProjectService.getProjectsForSolution(slnName).wait().map(sln => sln.Name);
				if(projectNames.length === 1) {
					projectName = projectNames[0];
				} else if (projectNames.length > 1) {
					projectName = this.$prompter.promptForChoice("Select project which you want to export:", projectNames).wait();
				} else {
					this.$logger.warn(`Solution ${slnName} does not have any projects.`);
					return;
				}
			}

			this.doExportRemoteProject(slnName, projectName).wait();
		}).future<void>()();
	}

	private doExportRemoteProject(remoteSolutionName: string, remoteProjectName: string): IFuture<void> {
		return (() => {
			let projectDir = path.join(this.$project.getNewProjectDir(), remoteProjectName);
			if(this.$fs.exists(projectDir).wait()) {
				this.$errors.fail("The folder %s already exists!", projectDir);
			}
			if (this.$project.projectData) {
				this.$errors.failWithoutHelp("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
			}

			temp.track();
			let projectZipFilePath = temp.path({prefix: "appbuilder-cli-", suffix: '.zip'});
			let unzipStream = this.$fs.createWriteStream(projectZipFilePath);
			let user = this.$userDataStore.getUser().wait();
			let tenantId = user.tenant.id;
			this.$remoteProjectService.makeTapServiceCall(() => this.$server.projects.exportProject(tenantId, remoteSolutionName, remoteProjectName, false, unzipStream)).wait();
			this.$fs.unzip(projectZipFilePath, projectDir).wait();

			try {
				// if there is no .abproject when exporting, we must be dealing with a cordova project, otherwise everything is set server-side
				let projectFile = path.join(projectDir, this.$projectConstants.PROJECT_FILE);
				if(!this.$fs.exists(projectFile).wait()) {
					let properties = this.$remoteProjectService.getProjectProperties(remoteSolutionName, remoteProjectName).wait();
					this.$project.createProjectFile(projectDir, properties).wait();
				}
			}
			catch(e) {
				this.$logger.warn("Couldn't create project file: %s", e.message);
			}

			this.$logger.info("%s has been successfully exported to %s", remoteProjectName, projectDir);
		}).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			if(args.length) {
				if(args.length > 2) {
					this.$errors.fail("This command accepts maximum two parameters - solution name and project name.");
				}

				let slnName = this.$remoteProjectService.getSolutionName(args[0]).wait();
				if(args[1]){
					this.$remoteProjectService.getProjectName(slnName, args[1]).wait();
				}
			}

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("cloud|export", CloudExportProjectsCommand);

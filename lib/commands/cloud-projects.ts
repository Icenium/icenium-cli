///<reference path="../.d.ts"/>
"use strict";

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
		private $options: IOptions,
		private $errors: IErrors) { }

	allowedParameters: ICommandParameter[] = [new SolutionIdCommandParameter(this.$remoteProjectService)];

	private printList(names: string[], solutionName?: string): void {
		let isProject = !!solutionName;
		let headers =  ["#", `${isProject ? 'Project' : 'Solution'} name`];
		let data = names.map((name: string, index: number) => [(++index).toString(), name]);
		let table = commonHelpers.createTable(headers, data);
		if (isProject) {
			this.$logger.out(`Projects for ${solutionName} solution:`);
		}

		this.$logger.out(table.toString());
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			let slnName: string;
			if(args[0]) {
				slnName = this.$remoteProjectService.getSolutionName(args[0]).wait();
			} else {
				let solutions = this.$remoteProjectService.getSolutions().wait().map(sln => sln.name);
				if (this.$options.all || !commonHelpers.isInteractive()) {
					this.printList(solutions);
					return;
				} else {
					slnName = this.$prompter.promptForChoice("Select solution for which to list projects:", solutions).wait();
				}
			}

			let projects = this.$remoteProjectService.getProjectsForSolution(slnName).wait().map(proj => proj.Name);
			this.printList(projects, slnName);
		}).future<void>()();
	}
}
$injector.registerCommand("cloud|*list", CloudListProjectsCommand);

export class CloudExportProjectsCommand implements ICommand {
	constructor(private $errors: IErrors,
		private $remoteProjectService: IRemoteProjectService,
		private $prompter: IPrompter,
		private $project: Project.IProject) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let projectIdentifier = args[1];
			let slnName: string;
			if(args[0]) {
				slnName = this.$remoteProjectService.getSolutionName(args[0]).wait();
			} else {
				let solutions = this.$remoteProjectService.getSolutions().wait().map(sln => sln.name);
				slnName = this.$prompter.promptForChoice("Select solution to export", solutions).wait();
				let projects = this.$remoteProjectService.getProjectsForSolution(slnName).wait().map(proj => proj.Name);
				let exportSolutionItem = "Export the whole solution";
				projects.push(exportSolutionItem);
				let selection = this.$prompter.promptForChoice("Select project to export", projects).wait();
				if(selection !== exportSolutionItem) {
					projectIdentifier = selection;
				}
			}

			if(projectIdentifier) {
				let projectName = this.$remoteProjectService.getProjectName(slnName, projectIdentifier).wait();
				this.$remoteProjectService.exportProject(slnName, projectName).wait();
			} else {
				this.$remoteProjectService.exportSolution(slnName).wait();
			}
		}).future<void>()();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			let solutionNames = this.$remoteProjectService.getSolutions().wait().map(sln => sln.name);
			if(!solutionNames || !solutionNames.length) {
				this.$errors.failWithoutHelp("You do not have any projects in the cloud.");
			}

			if (this.$project.projectData) {
				this.$errors.failWithoutHelp("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
			}

			if(args && args.length) {
				if(args.length > 2) {
					this.$errors.fail("This command accepts maximum two parameters - solution name and project name.");
				}

				let slnName = this.$remoteProjectService.getSolutionName(args[0]).wait();
				if(args[1]){
					this.$remoteProjectService.getProjectName(slnName, args[1]).wait();
				} else {
					// only one argument is passed
					let projectNames = this.$remoteProjectService.getProjectsForSolution(slnName).wait().map(sln => sln.Name);
					if(!projectNames.length) {
						this.$errors.failWithoutHelp(`Solution ${slnName} does not have any projects.`);
					}
				}
			} else if(!commonHelpers.isInteractive()) {
				this.$errors.fail("When console is not interactive, you have to provide at least one argument.");
			}

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("cloud|export", CloudExportProjectsCommand);

import commonHelpers = require("../common/helpers");

class SolutionIdCommandParameter implements ICommandParameter {
	constructor(private $remoteProjectService: IRemoteProjectService) { }
	public mandatory = false;

	public async validate(validationValue?: string): Promise<boolean> {
		if (validationValue) {
			let app = await this.$remoteProjectService.getSolutionData(validationValue);
			return !!app;
		}

		return false;
	}
}

export class CloudListProjectsCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $remoteProjectService: IRemoteProjectService,
		private $prompter: IPrompter,
		private $options: IOptions,
		private $errors: IErrors) { }

	public allowedParameters: ICommandParameter[] = [new SolutionIdCommandParameter(this.$remoteProjectService)];

	private printList(names: string[], appName?: string): void {
		let isProject = !!appName;
		let headers = ["#", `${isProject ? 'Project' : 'App'} name`];
		let data = names.map((name: string, index: number) => [(++index).toString(), name]);
		let table = commonHelpers.createTable(headers, data);
		if (isProject) {
			this.$logger.out(`Projects for ${appName} app:`);
		}

		this.$logger.out(table.toString());
	}

	public async execute(args: string[]): Promise<void> {
		let apps = await this.$remoteProjectService.getAvailableAppsAndSolutions();
		let slnName = args[0];
		if (!slnName) {
			let appDisplayNames = apps.map(app => app.colorizedDisplayName);
			if (this.$options.all || !commonHelpers.isInteractive() || appDisplayNames.length === 1) {
				this.printList(appDisplayNames);
				return;
			} else {
				slnName = await this.$prompter.promptForChoice("Select solution for which to list projects:", appDisplayNames);
			}
		}

		let projects = (await this.$remoteProjectService.getProjectsForSolution(slnName)).map(proj => proj.Name);
		this.printList(projects, slnName);
	}
}

$injector.registerCommand("cloud|*list", CloudListProjectsCommand);

export class CloudExportProjectsCommand implements ICommand {
	constructor(private $errors: IErrors,
		private $remoteProjectService: IRemoteProjectService,
		private $prompter: IPrompter,
		private $project: Project.IProject) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		let projectIdentifier = args[1];
		let slnName = args[0];
		if (!slnName) {
			let all = (await this.$remoteProjectService.getAvailableAppsAndSolutions()).map(sln => sln.colorizedDisplayName) || [];
			slnName = await this.$prompter.promptForChoice("Select solution to export", all);
			let projects = (await this.$remoteProjectService.getProjectsForSolution(slnName)).map(proj => proj.Name);
			let exportSolutionItem = "Export the whole solution";
			projects.push(exportSolutionItem);
			let selection = await this.$prompter.promptForChoice("Select project to export", projects);
			if (selection !== exportSolutionItem) {
				projectIdentifier = selection;
			}
		}

		if (projectIdentifier) {
			let projectName = await this.$remoteProjectService.getProjectName(slnName, projectIdentifier);
			await this.$remoteProjectService.exportProject(slnName, projectName);
		} else {
			await this.$remoteProjectService.exportSolution(slnName);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		let solutionNames = (await this.$remoteProjectService.getAvailableAppsAndSolutions()).map(sln => sln.colorizedDisplayName);
		if (!solutionNames || !solutionNames.length) {
			this.$errors.failWithoutHelp("You do not have any projects in the cloud.");
		}

		if (this.$project.projectData) {
			this.$errors.failWithoutHelp("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
		}

		if (args && args.length) {
			if (args.length > 2) {
				this.$errors.fail("This command accepts maximum two parameters - solution name and project name.");
			}

			let slnName = args[0];
			if (args[1]) {
				await this.$remoteProjectService.getProjectName(slnName, args[1]);
			} else {
				// only one argument is passed
				let projectNames = (await this.$remoteProjectService.getProjectsForSolution(slnName)).map(sln => sln.Name);
				if (!projectNames.length) {
					this.$errors.failWithoutHelp(`Solution ${slnName} does not have any projects.`);
				}
			}
		} else if (!commonHelpers.isInteractive()) {
			this.$errors.fail("When console is not interactive, you have to provide at least one argument.");
		}

		return true;
	}
}

$injector.registerCommand("cloud|export", CloudExportProjectsCommand);

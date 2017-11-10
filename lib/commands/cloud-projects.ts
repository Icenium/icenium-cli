import commonHelpers = require("../common/helpers");
import { EOL } from "os";
import { resolve, join, extname, dirname } from "path";

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
		private $options: IOptions) { }

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
	protected _isCloudToLocalExport = true;
	constructor(protected $errors: IErrors,
		protected $remoteProjectService: IRemoteProjectService,
		protected $cloudProjectsService: ICloudProjectsService,
		protected $project: Project.IProject) { }

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		const solutionProjectInfo = await this.$cloudProjectsService.getSolutionProjectInfo({
			projectName: args[1],
			solutionName: args[0],
			enableExportWholeSolution: true
		});

		if (solutionProjectInfo.projectName) {
			await this.$remoteProjectService.exportProject(solutionProjectInfo.solutionName, solutionProjectInfo.projectName);
		} else {
			await this.$remoteProjectService.exportSolution(solutionProjectInfo.solutionName);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		let solutionNames = (await this.$remoteProjectService.getAvailableAppsAndSolutions()).map(sln => sln.colorizedDisplayName);
		if (!solutionNames || !solutionNames.length) {
			this.$errors.failWithoutHelp("You do not have any projects in the cloud.");
		}

		if (this._isCloudToLocalExport && this.$project.projectData) {
			this.$errors.failWithoutHelp("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
		}

		if (args && args.length) {
			if (args.length > 2) {
				this.$errors.fail("This command accepts maximum two parameters - solution name and project name.");
			}

			if (!this._isCloudToLocalExport && !commonHelpers.isInteractive() && (!args[0] || !args[1])) {
				this.$errors.fail("Running this command in non-interactive mode requires both parameters - solution name and project name.");
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

export class ExportCommand extends CloudExportProjectsCommand implements ICommand {
	constructor($project: Project.IProject,
		protected $errors: IErrors,
		protected $remoteProjectService: IRemoteProjectService,
		protected $cloudProjectsService: ICloudProjectsService,
		private $server: Server.IServer,
		private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		private $fs: IFileSystem,
		private $progressIndicator: IProgressIndicator,
		private $options: IOptions) {
		super($errors, $remoteProjectService, $cloudProjectsService, $project);
	}

	public allowedParameters: ICommandParameter[] = [];
	protected _isCloudToLocalExport = false;

	public async execute(args: string[]): Promise<void> {
		const solutionProjectInfo = await this.$cloudProjectsService.getSolutionProjectInfo({
			projectName: args[1],
			solutionName: args[0],
			forceChooseProject: true
		});

		const properties = {
			Framework: solutionProjectInfo.framework,
			AcceptResults: "Url;LocalPath"
		};

		this.$logger.info("Exporting project...");
		// Fail early if the download path exists
		let downloadPath = resolve(this.$options.path || ".");
		const downloadPathExists = this.$fs.exists(downloadPath);
		let downloadPathIsDirectory = true;
		if (downloadPathExists) {
			downloadPathIsDirectory = this.$fs.getFsStats(downloadPath).isDirectory();
			if (!downloadPathIsDirectory) {
				this.$errors.failWithoutHelp(`Cannot download result package in ${downloadPath} as it already exists.`);
			}
		}

		const exportPromise = this.$server.appsBuild.exportProject(solutionProjectInfo.id, solutionProjectInfo.projectName, { Properties: properties, Targets: [] });
		const response = await this.$progressIndicator.showProgressIndicator<Server.BuildResultData>(exportPromise, 2000);
		if (response.Errors.length) {
			this.$errors.failWithoutHelp(`Export errors:${EOL}${response.Errors.map(e => e.Message).join(EOL)}`);
		} else {
			const buildItem = response.ResultsByTarget["Build"].Items[0];
			const downloadUrl = buildItem.FullPath;
			if (!downloadPathExists || downloadPathIsDirectory) {
				if (extname(downloadPath)) {
					this.$fs.ensureDirectoryExists(dirname(downloadPath));
				} else {
					this.$fs.ensureDirectoryExists(downloadPath);
					let resultFileName = buildItem.Filename;
					if (extname(resultFileName) === "") {
						resultFileName += ".zip";
					}

					downloadPath = join(downloadPath, resultFileName);
				}
			}

			this.$logger.info(`Downloading ${buildItem.Filename} to ${downloadPath}...`);
			const targetFile = this.$fs.createWriteStream(downloadPath);
			try {
				await this.$httpClient.httpRequest({
					url: downloadUrl,
					pipeTo: targetFile
				});
			} catch (ex) {
				this.$logger.trace("Downloading failed. Exception: ", ex);
				this.$fs.deleteFile(targetFile);
			}
		}
	}
}

$injector.registerCommand("export", ExportCommand);

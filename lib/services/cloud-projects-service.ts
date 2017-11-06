import { ExportOptions } from "../constants";

export class CloudProjectsService implements ICloudProjectsService {
	constructor(private $remoteProjectService: IRemoteProjectService,
		private $errors: IErrors,
		private $prompter: IPrompter) { }

	public async getSolutionProjectInfo(opts: ISolutionProjectPairOptions): Promise<ISolutionProjectInfo> {
		const apps = await this.$remoteProjectService.getAvailableAppsAndSolutions();
		let framework = "";
		let id = "";
		const noSolutionNamePassed = !opts.solutionName;

		if (noSolutionNamePassed) {
			const solutionNames = apps.map(sln => sln.colorizedDisplayName) || [];
			opts.solutionName = await this.$prompter.promptForChoice("Select solution to export", solutionNames);
		}

		const solutionData = await this.$remoteProjectService.getSolutionData(opts.solutionName);
		if (!solutionData.Items || !solutionData.Items.length) {
			this.$errors.failWithoutHelp(`Solution ${solutionData.Name} does not contain any projects.`);
		}

		if ((noSolutionNamePassed && !opts.projectName) || (opts.forceChooseProject && !opts.projectName)) {
			const projects = (await this.$remoteProjectService.getProjectsForSolution(opts.solutionName)).map(proj => proj.Name);
			if (opts.enableExportWholeSolution) {
				projects.push(ExportOptions.WholeSolution);
			}

			const selection = await this.$prompter.promptForChoice("Select project to export", projects);
			if (selection !== ExportOptions.WholeSolution) {
				opts.projectName = selection;
			}
		}

		if (opts.projectName) {
			opts.projectName = await this.$remoteProjectService.getProjectName(opts.solutionName, opts.projectName);
			const solution = solutionData.Items[0];
			framework = solution.Framework;
			const app = apps.find(sln => sln.colorizedDisplayName === solution.Name);
			id = app && app.id;
		}

		return {
			id,
			framework,
			projectName: opts.projectName,
			solutionName: opts.solutionName
		};
	}
}

$injector.register("cloudProjectsService", CloudProjectsService);

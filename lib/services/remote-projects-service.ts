import * as path from "path";
import * as helpers from "../helpers";
import temp = require("temp");

export class RemoteProjectService implements IRemoteProjectService {
	private clientSolutions: ITapAppData[];
	private clientProjectsPerSolution: IDictionary<Server.IWorkspaceItemData[]> = {};
	private static NOT_MIGRATED_IDENTIFER = " (NOT MIGRATED)";
	private static APP_FEATURE_TOGGLE_NAME = "projects-to-app";
	private _isMigrationEnabledForUser: boolean = null;

	constructor(private $server: Server.IServer,
		private $userDataStore: IUserDataStore,
		private $serviceProxy: Server.IAppBuilderServiceProxy,
		private $serviceProxyBase: Server.IServiceProxy,
		private $errors: IErrors,
		private $project: Project.IProject,
		private $projectConstants: Project.IConstants,
		private $fs: IFileSystem,
		private $logger: ILogger) { }

	public async getAvailableAppsAndSolutions(): Promise<ITapAppData[]> {
		if (!this.clientSolutions || !this.clientSolutions.length) {
			let apps = await this.getIsMigrationEnabledForUser() ? await this.getApps() : [];
			let solutions = await this.getSolutions();
			this.clientSolutions = solutions.concat(apps);
		}

		return this.clientSolutions;
	}

	public async getProjectName(solutionId: string, projectId: string): Promise<string> {
		let clientProjects = await this.getProjectsForSolution(solutionId);
		let result = helpers.findByNameOrIndex(projectId, clientProjects, (clientProject: Server.IWorkspaceItemData) => clientProject.Name);
		if (!result) {
			this.$errors.failWithoutHelp("Could not find project named '%s' inside '%s' solution or was not given a valid index. List available solutions with 'cloud list' command", projectId, solutionId);
		}

		return result.Name;
	}

	public async getProjectProperties(solutionId: string, projectId: string): Promise<any> {
		let projectName = await this.getProjectName(solutionId, projectId);
		let properties = (await (<any>this.getProjectData(solutionId, projectName)))["Properties"];
		properties.ProjectName = projectName;
		return properties;
	}

	public async getProjectsForSolution(appId: string): Promise<Server.IWorkspaceItemData[]> {
		let app = await this.getApp(appId);

		if (!(this.clientProjectsPerSolution[app.id] && this.clientProjectsPerSolution[app.id].length > 0)) {
			this.clientProjectsPerSolution[app.id] = _.sortBy((await this.getSolutionDataCore(app)).Items, project => project.Name);
		}

		return this.clientProjectsPerSolution[app.id];
	}

	public async exportProject(remoteSolutionName: string, remoteProjectName: string): Promise<void> {
		let app = await this.getApp(remoteSolutionName);
		let slnName = app.isApp ? app.id : app.name;
		let projectDir = await this.getExportDir(app.name, (unzipStream: any) => this.$server.appsProjects.exportProject(slnName, remoteProjectName, false, unzipStream), { discardSolutionSpaceHeader: app.isApp });
		await this.createProjectFile(projectDir, slnName, remoteProjectName);

		this.$logger.info("%s has been successfully exported to %s", remoteProjectName, projectDir);
	}

	public async exportSolution(remoteSolutionName: string): Promise<void> {
		let app = await this.getApp(remoteSolutionName);
		let slnName = app.isApp ? app.id : app.name;
		let solutionDir = await this.getExportDir(app.name, (unzipStream: any) => this.$server.apps.exportApplication(slnName, false, unzipStream), { discardSolutionSpaceHeader: app.isApp });

		let projectsDirectories = this.$fs.readDirectory(solutionDir);
		projectsDirectories.forEach(async projectName => await this.createProjectFile(path.join(solutionDir, projectName), remoteSolutionName, projectName));

		this.$logger.info("%s has been successfully exported to %s", slnName, solutionDir);
	}

	public async getSolutionData(solutionIdentifier: string): Promise<Server.SolutionData> {
		let app = await this.getApp(solutionIdentifier);
		return await this.getSolutionDataCore(app);
	}

	private async getIsMigrationEnabledForUser(): Promise<boolean> {
		if (this._isMigrationEnabledForUser === null) {
			let features = await this.$server.tap.getFeatures(await this.getUserTenantId(), "tap");
			this._isMigrationEnabledForUser = features && features.length && _.includes(features, RemoteProjectService.APP_FEATURE_TOGGLE_NAME);
		}
		return this._isMigrationEnabledForUser;
	}

	private async getSolutionDataCore(app: ITapAppData): Promise<Server.SolutionData> {
		let name = app.isApp ? app.id : app.name;
		return this.$serviceProxy.makeTapServiceCall(() => this.$server.apps.getApplication(name), { discardSolutionSpaceHeader: app.isApp });
	}

	private async getProjectData(solutionName: string, projectName: string): Promise<Server.IWorkspaceItemData> {
		return _.find(await this.getProjectsForSolution(solutionName), pr => pr.Name === projectName);
	}

	private async getExportDir(dirName: string, tapServiceCall: (_unzipStream: any) => Promise<any>, solutionSpaceHeaderOptions: { discardSolutionSpaceHeader: boolean }): Promise<string> {
		let exportDir = path.join(this.$project.getNewProjectDir(), dirName);
		if (this.$fs.exists(exportDir)) {
			this.$errors.fail("The folder %s already exists!", exportDir);
		}

		temp.track();
		let solutionZipFilePath = temp.path({ prefix: "appbuilder-cli-", suffix: '.zip' });
		let unzipStream = this.$fs.createWriteStream(solutionZipFilePath);

		this.$serviceProxy.makeTapServiceCall(async () => await tapServiceCall.apply(null, [unzipStream]), solutionSpaceHeaderOptions);
		await this.$fs.unzip(solutionZipFilePath, exportDir);

		return exportDir;
	}

	private async createProjectFile(projectDir: string, remoteSolutionName: string, remoteProjectName: string): Promise<void> {
		try {
			// if there is no .abproject when exporting, we must be dealing with a cordova project, otherwise everything is set server-side
			let projectFile = path.join(projectDir, this.$projectConstants.PROJECT_FILE);
			if (!this.$fs.exists(projectFile)) {
				let properties = await this.getProjectProperties(remoteSolutionName, remoteProjectName);
				await this.$project.createProjectFile(projectDir, properties);
			}
		} catch (e) {
			this.$logger.warn(`Couldn't create project file: ${e.message}`);
			this.$logger.trace(e);
		}
	}

	private async getApps(): Promise<ITapAppData[]> {
		let tenantId = await this.getUserTenantId();
		let existingClientApps = await this.$serviceProxyBase.call<any>('', 'GET', ['api', 'accounts', tenantId, 'apps'].join('/'), 'application/json', null, null);
		return _.sortBy(existingClientApps, (clientSolution: ITapAppData) => clientSolution.name)
			.map(app => {
				app.displayName = app.name;
				app.isApp = true;
				app.colorizedDisplayName = app.displayName;
				return app;
			});
	}

	private async getSolutions(): Promise<ITapAppData[]> {
		let existingClientSolutions = await this.$serviceProxy.makeTapServiceCall(() => this.$server.tap.getExistingClientSolutions());
		return _.sortBy(existingClientSolutions, (clientSolution: Server.TapSolutionData) => clientSolution.name)
			.map(sln => {
				return {
					accountId: sln.accountId,
					id: sln.id,
					type: null,
					settings: null,
					name: sln.name,
					description: sln.description,
					displayName: sln.name + (this.getIsMigrationEnabledForUser ? RemoteProjectService.NOT_MIGRATED_IDENTIFER : ""),
					colorizedDisplayName: sln.name + (this.getIsMigrationEnabledForUser ? `\x1B[31;1m${RemoteProjectService.NOT_MIGRATED_IDENTIFER}\x1B[0m` : ""),
					isApp: false
				};
			});
	}

	private async getApp(key: string): Promise<ITapAppData> {
		let availableAppsAndSolutions = await this.getAvailableAppsAndSolutions();
		let matchingApp = _.find(availableAppsAndSolutions, app => key === app.colorizedDisplayName) // from prompter we receive colorized message
			|| _.find(availableAppsAndSolutions, app => key === app.displayName) // in case the user writes the message on its own and adds '(NOT MIGRATED)'
			|| _.find(availableAppsAndSolutions, app => key === app.id)
			|| _.find(availableAppsAndSolutions, app => key === app.name)
			|| availableAppsAndSolutions[+key - 1];

		if (!matchingApp) {
			this.$errors.failWithoutHelp(`Unable to find app with identifier ${key}.`);
		}

		return matchingApp;
	}

	private async getUserTenantId(): Promise<string> {
		let user = await this.$userDataStore.getUser();
		return user.tenant.id;
	}
}

$injector.register("remoteProjectService", RemoteProjectService);

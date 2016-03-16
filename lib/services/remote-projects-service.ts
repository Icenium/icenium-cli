///<reference path="../.d.ts"/>
"use strict";
import * as path from "path";
import * as helpers from "../helpers";
import temp = require("temp");

export class RemoteProjectService implements IRemoteProjectService {
	private clientSolutions: ITapAppData[];
	private clientProjectsPerSolution: IDictionary<Server.IWorkspaceItemData[]> = {};
	private static NOT_MIGRATED_IDENTIFER = " (NOT MIGRATED)";
	private static APP_FEATURE_TOGGLE_NAME = "projects-to-app";
	private _isMigrationEnabledForUser: boolean = null;
	private get isMigrationEnabledForUser(): boolean {
		if(this._isMigrationEnabledForUser === null) {
			let features = this.$server.tap.getFeatures(this.getUserTenantId().wait(), "tap").wait();
			this._isMigrationEnabledForUser = features && features.length && _.contains(features, RemoteProjectService.APP_FEATURE_TOGGLE_NAME);
		}
		return this._isMigrationEnabledForUser;
	}

	constructor(private $server: Server.IServer,
				private $userDataStore: IUserDataStore,
				private $serviceProxy: Server.IAppBuilderServiceProxy,
				private $serviceProxyBase: Server.IServiceProxy,
				private $errors: IErrors,
				private $project: Project.IProject,
				private $projectConstants: IProjectConstants,
				private $fs: IFileSystem,
				private $logger: ILogger) { }

	public getAvailableAppsAndSolutions(): IFuture<ITapAppData[]> {
		return ((): ITapAppData[] => {
			if(!this.clientSolutions || !this.clientSolutions.length) {
				let apps = this.isMigrationEnabledForUser ? this.getApps().wait() : [];
				let solutions = this.getSolutions().wait();
				this.clientSolutions = solutions.concat(apps);
			}

			return this.clientSolutions;
		}).future<ITapAppData[]>()();
	}

	public getProjectName(solutionId: string, projectId: string): IFuture<string> {
		return ((): string => {
			let clientProjects = this.getProjectsForSolution(solutionId).wait();
			let result = helpers.findByNameOrIndex(projectId, clientProjects, (clientProject: Server.IWorkspaceItemData) => clientProject.Name);
			if(!result) {
				this.$errors.failWithoutHelp("Could not find project named '%s' inside '%s' solution or was not given a valid index. List available solutions with 'cloud list' command", projectId, solutionId);
			}

			return result.Name;
		}).future<string>()();
	}

	public getProjectProperties(solutionId: string, projectId: string): IFuture<any> {
		return (() => {
			let projectName = this.getProjectName(solutionId, projectId).wait();
			let properties = (<any>this.getProjectData(solutionId, projectName).wait())["Properties"];
			properties.ProjectName = projectName;
			return properties;
		}).future()();
	}

	public getProjectsForSolution(appId: string): IFuture<Server.IWorkspaceItemData[]> {
		return ((): Server.IWorkspaceItemData[] => {
			let app = this.getApp(appId).wait();

			if(!(this.clientProjectsPerSolution[app.id] && this.clientProjectsPerSolution[app.id].length > 0)) {
				this.clientProjectsPerSolution[app.id] = _.sortBy(this.getSolutionDataCore(app).wait().Items, project => project.Name);
			}

			return this.clientProjectsPerSolution[app.id];
		}).future<Server.IWorkspaceItemData[]>()();
	}

	public exportProject(remoteSolutionName: string, remoteProjectName: string): IFuture<void> {
		return (() => {
			let app = this.getApp(remoteSolutionName).wait();
			let slnName = app.isApp ? app.id : app.name;
			let projectDir = this.getExportDir(app.name,  (unzipStream: any) => this.$server.appsProjects.exportProject(slnName, remoteProjectName, false, unzipStream), {discardSolutionSpaceHeader: app.isApp}).wait();
			this.createProjectFile(projectDir, slnName, remoteProjectName).wait();

			this.$logger.info("%s has been successfully exported to %s", remoteProjectName, projectDir);
		}).future<void>()();
	}

	public exportSolution(remoteSolutionName: string): IFuture<void> {
		return (() => {
			let app = this.getApp(remoteSolutionName).wait();
			let slnName = app.isApp ? app.id : app.name;
			let solutionDir = this.getExportDir(app.name, (unzipStream: any) => this.$server.apps.exportApplication(slnName, false, unzipStream), {discardSolutionSpaceHeader: app.isApp}).wait();

			let projectsDirectories = this.$fs.readDirectory(solutionDir).wait();
			projectsDirectories.forEach(projectName => this.createProjectFile(path.join(solutionDir, projectName), remoteSolutionName, projectName).wait());

			this.$logger.info("%s has been successfully exported to %s", slnName, solutionDir);
		}).future<void>()();
	}

	public getSolutionData(solutionIdentifier: string): IFuture<Server.SolutionData> {
		return ((): Server.SolutionData => {
			let app = this.getApp(solutionIdentifier).wait();
			return this.getSolutionDataCore(app).wait();
		}).future<Server.SolutionData>()();
	}

	private getSolutionDataCore(app: ITapAppData): IFuture<Server.SolutionData> {
		let name = app.isApp ? app.id : app.name;
		return this.$serviceProxy.makeTapServiceCall(() => this.$server.apps.getApplication(name, true), {discardSolutionSpaceHeader: app.isApp});
	}

	private getProjectData(solutionName: string, projectName: string): IFuture<Server.IWorkspaceItemData> {
		return (() => {
			return _.find(this.getProjectsForSolution(solutionName).wait(), pr => pr.Name === projectName);
		}).future<Server.IWorkspaceItemData>()();
	}

	private getExportDir(dirName: string, tapServiceCall: (_unzipStream: any) => IFuture<any>, solutionSpaceHeaderOptions: {discardSolutionSpaceHeader: boolean}): IFuture<string> {
		return ((): string =>{
			let exportDir = path.join(this.$project.getNewProjectDir(), dirName);
			if(this.$fs.exists(exportDir).wait()) {
				this.$errors.fail("The folder %s already exists!", exportDir);
			}

			temp.track();
			let solutionZipFilePath = temp.path({prefix: "appbuilder-cli-", suffix: '.zip'});
			let unzipStream = this.$fs.createWriteStream(solutionZipFilePath);

			this.$serviceProxy.makeTapServiceCall(() => tapServiceCall.apply(null, [unzipStream]), solutionSpaceHeaderOptions).wait();
			this.$fs.unzip(solutionZipFilePath, exportDir).wait();

			return exportDir;
		}).future<string>()();
	}

	private createProjectFile(projectDir: string, remoteSolutionName: string, remoteProjectName: string): IFuture<void> {
		return (() => {
			try {
				// if there is no .abproject when exporting, we must be dealing with a cordova project, otherwise everything is set server-side
				let projectFile = path.join(projectDir, this.$projectConstants.PROJECT_FILE);
				if(!this.$fs.exists(projectFile).wait()) {
					let properties = this.getProjectProperties(remoteSolutionName, remoteProjectName).wait();
					this.$project.createProjectFile(projectDir, properties).wait();
				}
			} catch(e) {
				this.$logger.warn(`Couldn't create project file: ${e.message}`);
				this.$logger.trace(e);
			}
		}).future<void>()();
	}

	private getApps(): IFuture<ITapAppData[]> {
		return ((): ITapAppData[] => {
			let tenantId = this.getUserTenantId().wait();
			let existingClientApps = this.$serviceProxyBase.call<any>('', 'GET', ['api','accounts', tenantId, 'apps'].join('/'), 'application/json', null, null).wait();
			return _.sortBy(existingClientApps, (clientSolution: ITapAppData) => clientSolution.name)
					.map(app => {
						app.displayName = app.name;
						app.isApp = true;
						app.colorizedDisplayName = app.displayName;
						return app;
					});
		}).future<ITapAppData[]>()();
	}

	private getSolutions(): IFuture<ITapAppData[]> {
		return ((): ITapAppData[] => {
			let existingClientSolutions = this.$serviceProxy.makeTapServiceCall(() => this.$server.tap.getExistingClientSolutions()).wait();
			return _.sortBy(existingClientSolutions, (clientSolution: Server.TapSolutionData) => clientSolution.name)
					.map(sln => {
						return {
							accountId: sln.accountId,
							id: sln.id,
							type: null,
							settings: null,
							name: sln.name,
							description: sln.description,
							displayName: sln.name + (this.isMigrationEnabledForUser ? RemoteProjectService.NOT_MIGRATED_IDENTIFER : ""),
							colorizedDisplayName: sln.name + (this.isMigrationEnabledForUser ? `\x1B[31;1m${RemoteProjectService.NOT_MIGRATED_IDENTIFER}\x1B[0m` : ""),
							isApp: false
						};
					});
		}).future<ITapAppData[]>()();
	}

	private getApp(key: string): IFuture<ITapAppData> {
		return ((): ITapAppData => {
			let availableAppsAndSolutions = this.getAvailableAppsAndSolutions().wait();
			let matchingApp = _.find(availableAppsAndSolutions, app => key === app.colorizedDisplayName) // from prompter we receive colorized message
					|| _.find(availableAppsAndSolutions, app => key === app.displayName) // in case the user writes the message on its own and adds '(NOT MIGRATED)'
					|| _.find(availableAppsAndSolutions, app => key === app.id)
					|| _.find(availableAppsAndSolutions, app => key === app.name)
					|| availableAppsAndSolutions[+key - 1];

			if(!matchingApp) {
				this.$errors.failWithoutHelp(`Unable to find app with identifier ${key}.`);
			}

			return matchingApp;
		}).future<ITapAppData>()();
	}

	private getUserTenantId(): IFuture<string> {
		return ((): string => {
			let user = this.$userDataStore.getUser().wait();
			return user.tenant.id;
		}).future<string>()();
	}
}
$injector.register("remoteProjectService", RemoteProjectService);

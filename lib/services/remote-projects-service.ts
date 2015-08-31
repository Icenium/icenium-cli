///<reference path="../.d.ts"/>
"use strict";
import * as path from "path";
import * as helpers from "../helpers";
import temp = require("temp");

export class RemoteProjectService implements IRemoteProjectService {
	private clientSolutions: Server.TapSolutionData[];
	private clientProjectsPerSolution: IDictionary<Server.IWorkspaceItemData[]> = {};

	constructor(private $server: Server.IServer,
				private $userDataStore: IUserDataStore,
				private $serviceProxy: Server.IServiceProxy,
				private $errors: IErrors,
				private $project: Project.IProject,
				private $projectConstants: Project.IProjectConstants,
				private $fs: IFileSystem,
				private $logger: ILogger) { }

	public makeTapServiceCall<T>(call: () => IFuture<T>): IFuture<T> {
		return (() => {
			let user = this.$userDataStore.getUser().wait();
			let tenantId = user.tenant.id;
			this.$serviceProxy.setSolutionSpaceName(tenantId);
			try {
				return call().wait();
			} finally {
				this.$serviceProxy.setSolutionSpaceName(null);
			}
		}).future<T>()();
	}

	public getSolutionName(solutionId: string): IFuture<string> {
		return ((): string => {
			let clientSolutions = this.getSolutions().wait();

			let result = helpers.findByNameOrIndex(solutionId, clientSolutions, (clientSolution: Server.TapSolutionData) => clientSolution.name);
			if(!result) {
				this.$errors.failWithoutHelp("Could not find solution named '%s' or was not given a valid index. List available solutions with 'cloud list' command", solutionId);
			}

			return result.name;
		}).future<string>()();
	}

	public getProjectName(solutionId: string, projectId: string): IFuture<string> {
		return ((): string => {
			let slnName = this.getSolutionName(solutionId).wait();
			let clientProjects = this.getProjectsForSolution(slnName).wait();
			let result = helpers.findByNameOrIndex(projectId, clientProjects, (clientProject: Server.IWorkspaceItemData) => clientProject.Name);
			if(!result) {
				this.$errors.failWithoutHelp("Could not find project named '%s' inside '%s' solution or was not given a valid index. List available solutions with 'cloud list' command", projectId, solutionId);
			}

			return result.Name;
		}).future<string>()();
	}

	public getSolutions(): IFuture<Server.TapSolutionData[]> {
		return (() => {
			if (!this.clientSolutions) {
				let existingClientSolutions = this.makeTapServiceCall(() => this.$server.tap.getExistingClientSolutions()).wait();
				this.clientSolutions = _.sortBy(existingClientSolutions, (clientSolution: Server.TapSolutionData) => clientSolution.name);
			}

			return this.clientSolutions;
		}).future<Server.TapSolutionData[]>()();
	}

	public getProjectProperties(solutionId: string, projectId: string): IFuture<any> {
		return (() => {
			let solutionName = this.getSolutionName(solutionId).wait();
			let projectName = this.getProjectName(solutionName, projectId).wait();
			let properties = (<any>this.getProjectData(solutionName, projectName).wait())["Properties"];
			properties.ProjectName = projectName;
			return properties;
		}).future()();
	}

	public getProjectsForSolution(solutionName: string): IFuture<Server.IWorkspaceItemData[]> {
		return ((): Server.IWorkspaceItemData[] => {
			let slnName = this.getSolutionName(solutionName).wait();
			if(!(this.clientProjectsPerSolution[slnName] && this.clientProjectsPerSolution[slnName].length > 0)) {
				this.clientProjectsPerSolution[slnName] = _.sortBy(this.getSolutionData(slnName).wait().Items, project => project.Name);
			}

			return this.clientProjectsPerSolution[slnName];
		}).future<Server.IWorkspaceItemData[]>()();
	}

	public exportProject(remoteSolutionName: string, remoteProjectName: string): IFuture<void> {
		return (() => {
			let projectDir = this.getExportDir(remoteSolutionName, (tenantId: string, dirName: string, unzipStream: any) => this.$server.projects.exportProject(tenantId, remoteSolutionName, remoteProjectName, false, unzipStream)).wait();
			this.createProjectFile(projectDir, remoteSolutionName, remoteProjectName).wait();

			this.$logger.info("%s has been successfully exported to %s", remoteProjectName, projectDir);
		}).future<void>()();
	}

	public exportSolution(remoteSolutionName: string): IFuture<void> {
		return (() => {
			let solutionDir = this.getExportDir(remoteSolutionName, (tenantId: string, dirName: string, unzipStream: any) => this.$server.projects.exportSolution(tenantId, remoteSolutionName, false, unzipStream)).wait();

			let projectsDirectories = this.$fs.readDirectory(solutionDir).wait();
			projectsDirectories.forEach(projectName => this.createProjectFile(path.join(solutionDir, projectName), remoteSolutionName, projectName).wait());

			this.$logger.info("%s has been successfully exported to %s", remoteSolutionName, solutionDir);
		}).future<void>()();
	}

	private getSolutionData(projectName: string): IFuture<Server.SolutionData> {
		return this.makeTapServiceCall(() => this.$server.projects.getSolution(projectName, true));
	}

	private getProjectData(solutionName: string, projectName: string): IFuture<Server.IWorkspaceItemData> {
		return (() => {
			return _.find(this.getProjectsForSolution(solutionName).wait(), pr => pr.Name === projectName);
		}).future<Server.IWorkspaceItemData>()();
	}

	private getExportDir(dirName: string, tapServiceCall: (_tenantId: string, _dirName: string, _unzipStream: any) => IFuture<any>): IFuture<string> {
		return ((): string =>{
			let exportDir = path.join(this.$project.getNewProjectDir(), dirName);
			if(this.$fs.exists(exportDir).wait()) {
				this.$errors.fail("The folder %s already exists!", exportDir);
			}

			temp.track();
			let solutionZipFilePath = temp.path({prefix: "appbuilder-cli-", suffix: '.zip'});
			let unzipStream = this.$fs.createWriteStream(solutionZipFilePath);
			let tenantId = this.getUserTenantId().wait();

			this.makeTapServiceCall(() => tapServiceCall.apply(null, [tenantId, dirName, unzipStream])).wait();
			this.$fs.unzip(solutionZipFilePath, exportDir).wait();

			return exportDir;
		}).future<string>()();
	}

	private getUserTenantId(): IFuture<string> {
		return (() => {
			let user = this.$userDataStore.getUser().wait();
			return user.tenant.id;
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
}
$injector.register("remoteProjectService", RemoteProjectService);

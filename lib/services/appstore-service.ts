import * as constants from "../common/constants";

export class AppStoreService implements IAppStoreService {
	constructor(public $logger: ILogger,
				public $errors: IErrors,
				public $server: Server.IServer,
				private $project: Project.IProject,
				private $buildService: Project.IBuildService
			) {}

	public upload(userName: string, password: string, application: string): IFuture<void> {
		return (() => {
			this.$logger.info("Checking that iTunes Connect application is ready for upload.");
			let apps = this.$server.itmstransporter.getApplicationsReadyForUpload(userName, password).wait();
			let theApp = _.find(apps, (app: Server.Application) => app.Application === application);
			if(!theApp) {
				this.$errors.fail("App '%s' does not exist or is not ready for upload.", application);
			}

			this.$logger.info("Building release package.");
			let buildResult = this.$buildService.build({
				platform: "iOS",
				projectConfiguration: constants.Configurations.Release,
				buildConfiguration: constants.Configurations.Release,
				provisionTypes: [constants.ProvisionType.AppStore]
			}).wait();
			buildResult = _.filter(buildResult, (def: Server.IPackageDef) => !def.disposition || def.disposition === "BuildResult");
			if(!buildResult[0] || !buildResult[0].solutionPath) {
				this.$errors.fail({ formatStr: "Build failed.", suppressCommandHelp: true });
			}

			this.$logger.info("Uploading package to iTunes Connect. This may take several minutes.");
			let solutionPath = buildResult[0].solutionPath;
			let projectPath = solutionPath.substr(solutionPath.indexOf("/") + 1);

			let projectData = this.$project.projectData;
			this.$server.itmstransporter.uploadApplication1(projectData.ProjectName, projectData.ProjectName,
				projectPath, theApp.AppleID, userName, password).wait();

			this.$logger.info("Upload complete.");
		}).future<void>()();
	}

	public getApplicationsReadyForUpload(userName: string, password: string): IFuture<Server.Application[]> {
		return (() => {
			let apps = this.$server.itmstransporter.getApplicationsReadyForUpload(userName, password).wait();
			apps = _.sortBy(apps, (app: Server.Application) => app.Application);
			return apps;
		}).future<Server.Application[]>()();
	}
}
$injector.register("appStoreService", AppStoreService);


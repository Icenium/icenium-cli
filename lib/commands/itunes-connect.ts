///<reference path="../.d.ts"/>

"use strict";

import constants = require("../common/mobile/constants");
var options:any = require("../options");

interface IAppStoreApplication {
	AppleID: number;
	ReservedBundleIdentifier: string;
	Application: string;
	"SKU Number": string;
	"Version Number": string;
	IconURL: string;
}

export class ListApplicationsReadyForUploadCommand implements ICommand {
	constructor(private $server: Server.IServer,
		private $logger: ILogger,
		private $prompter: IPrompter,
		private $errors: IErrors) {}

	execute(args:string[]): IFuture<void> {
		return (() => {
			var userName = args[0];
			var password = args[1];
			if (!userName) {
				this.$errors.fail("Missing Apple ID.");
			}

			if (!password) {
				password = this.$prompter.getPassword("Apple ID password").wait();
			}

			var apps: IAppStoreApplication[] = this.$server.itmstransporter.getApplicationsReadyForUpload(userName, password).wait();
			apps = _.sortBy(apps, (app) => app.Application);

			apps.forEach((app) => {
				this.$logger.out("%s %s (%s)", app.Application, app["Version Number"], app.ReservedBundleIdentifier);
			})

			if (!apps.length) {
				this.$logger.out("No applications are ready for upload.");
			}
		}).future<void>()();
	}
}
$injector.registerCommand("appstore|list", ListApplicationsReadyForUploadCommand);

export class UploadApplicationCommand implements ICommand {
	constructor(private $server: Server.IServer,
		private $logger: ILogger,
		private $errors: IErrors,
		private $prompter: IPrompter,
		private $project: Project.IProject,
		private $buildService: Project.IBuildService,
		private $identityManager: Server.IIdentityManager) {}

	execute(args:string[]): IFuture<void> {
		return (() => {
			var application = args[0];
			var userName = args[1];
			var password = args[2];

			if (!application) {
				this.$errors.fail("No application specified. Specify an application that is ready for upload in iTunes Connect.");
			}

			if (!userName) {
				this.$errors.fail("Missing user name.");
			}

			this.$project.ensureProject();

			if (options.provision) {
				this.$logger.info("Checking provision.");
				var provision = this.$identityManager.findProvision(options.provision).wait();

				if (provision.ProvisionType !== constants.ProvisionType.AppStore) {
					this.$errors.fail("Provision '%s' is of type '%s'. It must be of type AppStore in order to publish your app.",
						provision.Name, provision.ProvisionType);
				}
			}

			if (!password) {
				password = this.$prompter.getPassword("Apple ID password").wait();
			}

			this.$logger.info("Checking that iTunes Connect application is ready for upload.");
			var apps: IAppStoreApplication[] = this.$server.itmstransporter.getApplicationsReadyForUpload(userName, password).wait();
			var theApp = _.find(apps, (app) => app.Application === application);
			if (!theApp) {
				this.$errors.fail("App '%s' does not exist or is not ready for upload.", application);
			}

			this.$logger.info("Building release package.")
			var buildResult = this.$buildService.build({
				platform: "iOS",
				configuration: "Release",
				provisionTypes: [constants.ProvisionType.AppStore]
			}).wait();
			if (!buildResult[0] || !buildResult[0].solutionPath) {
				this.$errors.fail({formatStr: "Build failed.", suppressCommandHelp: true});
			}

			this.$logger.info("Uploading package to iTunes Connect. This may take several minutes.");
			var solutionPath = buildResult[0].solutionPath;
			var projectPath = solutionPath.substr(solutionPath.indexOf("/") + 1);

			var projectData = this.$project.projectData;
			this.$server.itmstransporter.uploadApplication(projectData.ProjectName, projectData.ProjectName,
				projectPath, userName, password, theApp.AppleID.toString()).wait();

			this.$logger.info("Upload complete.")
		}).future<void>()();
	}
}
$injector.registerCommand("appstore|upload", UploadApplicationCommand);

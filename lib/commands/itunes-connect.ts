///<reference path="../.d.ts"/>
"use strict";

import constants = require("../common/mobile/constants");
import commandParams = require("../common/command-params");
let Table = require("cli-table");

export class AppstoreApplicationCommandBase implements ICommand {
	constructor(public $server: Server.IServer,
		public $logger: ILogger,
		public $prompter: IPrompter,
		public $errors: IErrors) { }

	execute(args: string[]): IFuture<void> {
		this.$errors.fail("This function should never execute.");
		return null;
	}

	allowedParameters: ICommandParameter[] = [];

	public getAppleId(): IFuture<string> {
		return (() => {
			let appleIdSchema: IPromptSchema = {
				message: "Apple ID",
				type: "input",
				name: "appleId",
				validate: (value: string) => {
					return !value ? "Apple ID must be non-empty." : true;
				}
			};

			let result = this.$prompter.get([appleIdSchema]).wait();
			return result["appleId"];
		}).future<string>()();
	}
}

export class ListApplicationsReadyForUploadCommand extends AppstoreApplicationCommandBase {
	constructor(public $server: Server.IServer,
		public $logger: ILogger,
		public $prompter: IPrompter,
		public $errors: IErrors,
		private $loginManager: ILoginManager,
		private $injector: IInjector) {
		super($server, $logger, $prompter, $errors);
	}

    allowedParameters = [new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];
	
    execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			let userName = args[0];
			let password = args[1];

			if(!userName) {
				userName = this.getAppleId().wait();
			}

			if(!password) {
				password = this.$prompter.getPassword("Apple ID password").wait();
			}

			let apps = this.$server.itmstransporter.getApplicationsReadyForUpload(userName, password).wait();
			apps = _.sortBy(apps, (app: Server.Application) => app.Application);
			if(!apps.length) {
				this.$logger.out("No applications are ready for upload.");
				return;
			}

			let table = new Table({
				head: ["Application", "Version", "Bundle ID"],
				chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
			});
			_.each(apps, (app:Server.Application) => {
				table.push([app.Application, (<any>app)["Version Number"], app.ReservedBundleIdentifier]);
			});
			this.$logger.out(table.toString());

		}).future<void>()();
	}
}
$injector.registerCommand("appstore|list", ListApplicationsReadyForUploadCommand);

export class UploadApplicationCommand extends AppstoreApplicationCommandBase {
	constructor(public $server: Server.IServer,
		public $logger: ILogger,
		public $errors: IErrors,
		public $prompter: IPrompter,
		private $project: Project.IProject,
		private $buildService: Project.IBuildService,
		private $identityManager: Server.IIdentityManager,
		private $stringParameterBuilder: IStringParameterBuilder,
		private $loginManager: ILoginManager,
		private $injector: IInjector,
		private $projectConstants: Project.IProjectConstants,
		private $options: IOptions) {
		super($server, $logger, $prompter, $errors);
	}

	allowedParameters = [this.$stringParameterBuilder.createMandatoryParameter("No application specified. Specify an application that is ready for upload in iTunes Connect."),
		new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];

	execute(args:string[]): IFuture<void> {
		return (() => {
			if(!this.$project.capabilities.uploadToAppstore) {
				this.$errors.failWithoutHelp("You cannot upload %s projects to AppStore.", this.$project.projectData.Framework);
			}

			this.$loginManager.ensureLoggedIn().wait();

			let application = args[0];
			let userName = args[1];
			let password = args[2];
			if(!application) {
				this.$errors.fail("No application specified. Specify an application that is ready for upload in iTunes Connect.");
			}

			if(!userName) {
				userName = this.getAppleId().wait();
			}

			if(this.$options.provision) {
				this.$logger.info("Checking provision.");
				let provision = this.$identityManager.findProvision(this.$options.provision).wait();

				if(provision.ProvisionType !== constants.ProvisionType.AppStore) {
					this.$errors.fail("Provision '%s' is of type '%s'. It must be of type AppStore in order to publish your app.",
						provision.Name, provision.ProvisionType);
				}
			}

			if(!password) {
				password = this.$prompter.getPassword("Apple ID password").wait();
			}

			this.$logger.info("Checking that iTunes Connect application is ready for upload.");
			let apps = this.$server.itmstransporter.getApplicationsReadyForUpload(userName, password).wait();
			let theApp = _.find(apps, (app: Server.Application) => app.Application === application);
			if(!theApp) {
				this.$errors.fail("App '%s' does not exist or is not ready for upload.", application);
			}

			this.$logger.info("Building release package.");
			let buildResult = this.$buildService.build({
				platform: "iOS",
				configuration: "Release",
				provisionTypes: [constants.ProvisionType.AppStore]
			}).wait();
			if(!buildResult[0] || !buildResult[0].solutionPath) {
				this.$errors.fail({ formatStr: "Build failed.", suppressCommandHelp: true });
			}

			this.$logger.info("Uploading package to iTunes Connect. This may take several minutes.");
			let solutionPath = buildResult[0].solutionPath;
			let projectPath = solutionPath.substr(solutionPath.indexOf("/") + 1);

			let projectData = this.$project.projectData;
			this.$server.itmstransporter.uploadApplication(projectData.ProjectName, projectData.ProjectName,
				projectPath, theApp.AppleID, userName, password).wait();

			this.$logger.info("Upload complete.")
		}).future<void>()();
	}
}
$injector.registerCommand("appstore|upload", UploadApplicationCommand);

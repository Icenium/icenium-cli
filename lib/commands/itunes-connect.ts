import * as constants from "../common/constants";
import * as commandParams from "../common/command-params";
let Table = require("cli-table");

function getAppleId($prompter: IPrompter): IFuture<string> {
	return (() => {
		let appleIdSchema: IPromptSchema = {
			message: "Apple ID",
			type: "input",
			name: "appleId",
			validate: (value: string) => {
				return !value ? "Apple ID must be non-empty." : true;
			}
		};

		let result = $prompter.get([appleIdSchema]).wait();
		return result["appleId"];
	}).future<string>()();
}

export class ListApplicationsReadyForUploadCommand implements ICommand {
	constructor(public $logger: ILogger,
		public $prompter: IPrompter,
		private $loginManager: ILoginManager,
		private $injector: IInjector,
		private $appStoreService: IAppStoreService) {}

    allowedParameters = [new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];

    execute(args: string[]): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			let userName = args[0];
			let password = args[1];

			if(!userName) {
				userName = getAppleId(this.$prompter).wait();
			}

			if(!password) {
				password = this.$prompter.getPassword("Apple ID password").wait();
			}

			let apps = this.$appStoreService.getApplicationsReadyForUpload(userName, password).wait();
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

export class UploadApplicationCommand implements ICommand {
	constructor(public $logger: ILogger,
		public $errors: IErrors,
		public $prompter: IPrompter,
		private $project: Project.IProject,
		private $identityManager: Server.IIdentityManager,
		private $stringParameterBuilder: IStringParameterBuilder,
		private $loginManager: ILoginManager,
		private $injector: IInjector,
		private $options: IOptions,
		private $appStoreService: IAppStoreService) {}

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
				userName = getAppleId(this.$prompter).wait();
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

			this.$appStoreService.upload(userName, password, application).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("appstore|upload", UploadApplicationCommand);

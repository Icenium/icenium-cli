import * as constants from "../common/constants";
import * as commandParams from "../common/command-params";
let Table = require("cli-table");

async function getAppleId($prompter: IPrompter): Promise<string> {
	let appleIdSchema: IPromptSchema = {
		message: "Apple ID",
		type: "input",
		name: "appleId",
		validate: (value: string) => {
			return !value ? "Apple ID must be non-empty." : true;
		}
	};

	let result = await $prompter.get([appleIdSchema]);
	return result["appleId"];
}

export class ListApplicationsReadyForUploadCommand implements ICommand {
	constructor(public $logger: ILogger,
		public $prompter: IPrompter,
		private $loginManager: ILoginManager,
		private $injector: IInjector,
		private $appStoreService: IAppStoreService) { }

	public allowedParameters = [new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];

	public async execute(args: string[]): Promise<void> {
		await this.$loginManager.ensureLoggedIn();

		let userName = args[0];
		let password = args[1];

		if (!userName) {
			userName = await getAppleId(this.$prompter);
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		let apps = await this.$appStoreService.getApplicationsReadyForUpload(userName, password);
		if (!apps.length) {
			this.$logger.out("No applications are ready for upload.");
			return;
		}

		let table = new Table({
			head: ["Application", "Version", "Bundle ID"],
			chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
		});
		_.each(apps, (app: Server.Application) => {
			table.push([app.Application, (<any>app)["Version Number"], app.ReservedBundleIdentifier]);
		});
		this.$logger.out(table.toString());
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
		private $appStoreService: IAppStoreService) { }

	public allowedParameters = [this.$stringParameterBuilder.createMandatoryParameter("No application specified. Specify an application that is ready for upload in iTunes Connect."),
	new commandParams.StringCommandParameter(this.$injector), new commandParams.StringCommandParameter(this.$injector)];

	public async execute(args: string[]): Promise<void> {
		if (!this.$project.capabilities.uploadToAppstore) {
			this.$errors.failWithoutHelp("You cannot upload %s projects to AppStore.", this.$project.projectData.Framework);
		}

		await this.$loginManager.ensureLoggedIn();

		let application = args[0];
		let userName = args[1];
		let password = args[2];
		if (!application) {
			this.$errors.fail("No application specified. Specify an application that is ready for upload in iTunes Connect.");
		}

		if (!userName) {
			userName = await getAppleId(this.$prompter);
		}

		if (this.$options.provision) {
			this.$logger.info("Checking provision.");
			let provision = await this.$identityManager.findProvision(this.$options.provision);

			if (provision.ProvisionType !== constants.ProvisionType.AppStore) {
				this.$errors.fail("Provision '%s' is of type '%s'. It must be of type AppStore in order to publish your app.",
					provision.Name, provision.ProvisionType);
			}
		}

		if (!password) {
			password = await this.$prompter.getPassword("Apple ID password");
		}

		await this.$appStoreService.upload(userName, password, application);
	}
}

$injector.registerCommand("appstore|upload", UploadApplicationCommand);

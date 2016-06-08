import {KendoUIBaseCommand} from "./kendoui-base";

class KendoUINotesCommand extends KendoUIBaseCommand implements ICommand {

	constructor(private $logger: ILogger,
		private $opener: IOpener,
		private $prompter: IPrompter,
		$errors: IErrors,
		$kendoUIService: IKendoUIService,
		$loginManager: ILoginManager,
		$options: IOptions,
		$project: Project.IProject) {

		super($errors, $project, $kendoUIService, $loginManager, $options);
	}

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return (() => {
			let packages = this.getKendoPackages({withReleaseNotesOnly: true}).wait();
			if (packages.length === 1) {
				this.$opener.open(_.first(packages).ReleaseNotesUrl);
				return;
			}

			this.$logger.out("You can review release notes for the following Kendo UI packages.");
			this.$logger.out(this.getKendoPackagesAsTable(packages));
			let schema: IPromptSchema = {
				type: "input",
				name: "packageIdx",
				message: "Enter the index of the package",
				validate: (value: string) => {
					let num = parseInt(value, 10);
					return !isNaN(num) && num >= 1 && num <= packages.length ? true : `Valid values are between 1 and ${packages.length}.`;
				}
			};

			let choice = this.$prompter.get([schema]).wait(),
				selectedPackage = packages[parseInt(choice.packageIdx) - 1];

			this.$opener.open(selectedPackage.ReleaseNotesUrl);
		}).future<void>()();
	}
}

$injector.registerCommand("kendoui|notes", KendoUINotesCommand);

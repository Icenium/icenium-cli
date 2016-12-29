import {KendoUIBaseCommand} from "./kendoui-base";

class KendoUIListCommand extends KendoUIBaseCommand implements ICommand {

	constructor(private $logger: ILogger,
		$errors: IErrors,
		$kendoUIService: IKendoUIService,
		$loginManager: ILoginManager,
		$options: IOptions,
		$project: Project.IProject) {

		super($errors, $project, $kendoUIService, $loginManager, $options);
	}

	allowedParameters: ICommandParameter[] = [];

	async execute(args: string[]): Promise<void> {
			let packages = await  this.getKendoPackages();
			this.$logger.out("You can download and install the following Kendo UI packages.");
			this.$logger.out(this.getKendoPackagesAsTable(packages));
	}
}

$injector.registerCommand("kendoui|*list", KendoUIListCommand);

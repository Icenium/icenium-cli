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

	execute(args: string[]): IFuture<void> {
		return (() => {
			let packages = this.getKendoPackages().wait();
			this.$logger.out("You can download and install the following Kendo UI packages.");
			this.$logger.out(this.getKendoPackagesAsTable(packages));
		}).future<void>()();
	}
}

$injector.registerCommand("kendoui|*list", KendoUIListCommand);

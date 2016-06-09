class UpgradeScreenBuilder implements ICommand {

	constructor(private $logger: ILogger,
		private $options: IOptions,
		private $project: Project.IProject,
		private $screenBuilderService: IScreenBuilderService) {	}

	allowedParameters: ICommandParameter[] = [];

	canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			this.$project.ensureProject();
			let projectDir = this.$project.getProjectDir().wait();
			this.$screenBuilderService.ensureScreenBuilderProject(projectDir).wait();

			return true;
		}).future<boolean>()();
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			if (!this.$screenBuilderService.shouldUpgrade(this.$options.path).wait()) {
				this.$logger.info("Your project is already up-to-date with the latest Screen Builder.");
				return;
			}

			this.$screenBuilderService.upgrade(this.$options.path).wait();
			this.$logger.info("Project successfully upgraded.");
		}).future<void>()();
	}
}

$injector.registerCommand("upgrade-screenbuilder", UpgradeScreenBuilder);

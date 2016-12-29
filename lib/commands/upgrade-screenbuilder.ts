class UpgradeScreenBuilder implements ICommand {

	constructor(private $logger: ILogger,
		private $options: IOptions,
		private $project: Project.IProject,
		private $screenBuilderService: IScreenBuilderService) {	}

	allowedParameters: ICommandParameter[] = [];

	canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			this.$project.ensureProject();
			let projectDir = this.$project.getProjectDir();
			this.$screenBuilderService.ensureScreenBuilderProject(projectDir);

			return true;
		}).future<boolean>()();
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			if (! await this.$screenBuilderService.shouldUpgrade(this.$options.path)) {
				this.$logger.info("Your project is already up-to-date with the latest Screen Builder.");
				return;
			}

			await this.$screenBuilderService.upgrade(this.$options.path);
			this.$logger.info("Project successfully upgraded.");
		}).future<void>()();
	}
}

$injector.registerCommand("upgrade-screenbuilder", UpgradeScreenBuilder);

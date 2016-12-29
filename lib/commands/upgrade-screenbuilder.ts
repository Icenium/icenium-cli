class UpgradeScreenBuilder implements ICommand {

	constructor(private $logger: ILogger,
		private $options: IOptions,
		private $project: Project.IProject,
		private $screenBuilderService: IScreenBuilderService) {	}

	allowedParameters: ICommandParameter[] = [];

	async canExecute(args: string[]): Promise<boolean> {
			this.$project.ensureProject();
			let projectDir = this.$project.getProjectDir();
			this.$screenBuilderService.ensureScreenBuilderProject(projectDir);

			return true;
	}

	async execute(args: string[]): Promise<void> {
			if (! await this.$screenBuilderService.shouldUpgrade(this.$options.path)) {
				this.$logger.info("Your project is already up-to-date with the latest Screen Builder.");
				return;
			}

			await this.$screenBuilderService.upgrade(this.$options.path);
			this.$logger.info("Project successfully upgraded.");
	}
}

$injector.registerCommand("upgrade-screenbuilder", UpgradeScreenBuilder);

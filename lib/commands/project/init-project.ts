export class InitProjectCommand implements ICommand {
	constructor(private frameworkIdentifier: string,
		private $project: Project.IProject,
		private $logger: ILogger) { }

	public execute(args: string[]): IFuture<void> {
		return this.initializeProjectFromExistingFiles(this.frameworkIdentifier);
	}

	public async initializeProjectFromExistingFiles(frameworkIdentifier: string): Promise<void> {
			this.$project.initializeProjectFromExistingFiles(frameworkIdentifier).wait();
			this.$logger.out("Successfully initialized %s project.", frameworkIdentifier);
	}

	allowedParameters: ICommandParameter[] = [];
}

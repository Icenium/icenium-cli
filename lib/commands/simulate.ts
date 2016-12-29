export class SimulateCommand implements ICommand {
	private projectData: Project.IData;

	constructor(private $errors: IErrors,
		private $project: Project.IProject,
		private $simulatorService: ISimulatorService,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		private $hostCapabilities: IHostCapabilities) {
			this.projectData = $project.projectData;
	}

	public async execute(args: string[]): Promise<void> {
			if (this.$simulatorPlatformServices.canRunApplication && this.$simulatorPlatformServices.canRunApplication().wait()) {
				this.$simulatorService.launchSimulator().wait();
			}
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("simulate", SimulateCommand);

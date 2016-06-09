export class SimulateCommand implements ICommand {
	private projectData: Project.IData;

	constructor(private $errors: IErrors,
		private $project: Project.IProject,
		private $simulatorService: ISimulatorService,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		private $hostCapabilities: IHostCapabilities) {
			this.projectData = $project.projectData;
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if (this.$simulatorPlatformServices.canRunApplication && this.$simulatorPlatformServices.canRunApplication().wait()) {
				this.$simulatorService.launchSimulator().wait();
			}
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("simulate", SimulateCommand);

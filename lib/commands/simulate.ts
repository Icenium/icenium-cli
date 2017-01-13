export class SimulateCommand implements ICommand {
	private projectData: Project.IData;

	constructor(private $project: Project.IProject,
		private $simulatorService: ISimulatorService,
		private $simulatorPlatformServices: IExtensionPlatformServices) {
		this.projectData = this.$project.projectData;
	}

	public async execute(args: string[]): Promise<void> {
		if (this.$simulatorPlatformServices.canRunApplication && await this.$simulatorPlatformServices.canRunApplication()) {
			await this.$simulatorService.launchSimulator();
		}
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("simulate", SimulateCommand);

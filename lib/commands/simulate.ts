///<reference path="../.d.ts"/>
"use strict";

export class SimulateCommand implements ICommand {
	private projectData: IProjectData;

	constructor(private $errors: IErrors,
		private $project: Project.IProject,
		private $simulatorService: ISimulatorService,
		private $simulatorPlatformServices: IExtensionPlatformServices,
		private $hostCapabilities: IHostCapabilities) {
			this.projectData = $project.projectData;
	}

	public execute(args: string[]): IFuture<void> {
		return this.$simulatorService.launchSimulator();
	}

	allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		if(!this.$hostCapabilities.capabilities[process.platform].debugToolsSupported) {
			this.$errors.fail("In this version of the Telerik AppBuilder CLI, you cannot run the device simulator on %s. The device simulator for %s will become available in a future release of the Telerik AppBuilder CLI.", process.platform, process.platform);
		}

		this.$project.ensureProject();

		if(!this.$project.capabilities.simulate) {
			this.$errors.fail("You cannot run %s based projects in the device simulator.", this.$project.projectData.Framework);
		}

		return this.$simulatorPlatformServices.canRunApplication();
	}
}
$injector.registerCommand("simulate", SimulateCommand);

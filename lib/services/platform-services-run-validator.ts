///<reference path="../.d.ts"/>
"use strict";

export class PlatformServicesRunValidator implements IRunValidator {
	constructor(protected $errors: IErrors,
		protected $hostCapabilities: IHostCapabilities,
		protected $project: Project.IProject) { }

	public canRunApplication(): IFuture<boolean> {
		return (() => {
			if (!this.$hostCapabilities.capabilities[process.platform].debugToolsSupported) {
				this.$errors.fail(`In this version of the Telerik AppBuilder CLI, you cannot run the device simulator on ${process.platform}. The device simulator for ${process.platform} will become available in a future release of the Telerik AppBuilder CLI.`);
			}

			this.$project.ensureProject();

			if (!this.$project.capabilities.simulate) {
				this.$errors.fail(`You cannot run ${this.$project.projectData.Framework} based projects in the device simulator.`);
			}

			return true;
		}).future<boolean>()();
	}
}

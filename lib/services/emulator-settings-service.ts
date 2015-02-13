///<reference path="../.d.ts"/>
"use strict";

export class EmulatorSettingsService implements Mobile.IEmulatorSettingsService {
	constructor(private $project: Project.IProject,
		private $errors: IErrors) { }

	public canStart(platform: string): IFuture<boolean> {
		return (() => {
			this.$project.ensureProject();

			if(this.$project.capabilities.emulate) {
				return _.contains(this.$project.getProjectTargets().wait(), platform.toLowerCase());
			}

			this.$errors.fail("The operation is not supported for %s projects.", this.$project.projectData.Framework);
		}).future<boolean>()();
	}

	public get minVersion(): number {
		return this.$project.requiredAndroidApiLevel;
	}
}
$injector.register("emulatorSettingsService", EmulatorSettingsService);
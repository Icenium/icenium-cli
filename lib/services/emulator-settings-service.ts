///<reference path="../.d.ts"/>
"use strict";

export class EmulatorSettingsService implements Mobile.IEmulatorSettingsService {
	constructor(private $project: Project.IProject) { }

	public canStart(platform: string): IFuture<boolean> {
		return (() => {
			this.$project.ensureProject();
			return _.contains(this.$project.projectTargets.wait(), platform.toLowerCase());
		}).future<boolean>()();
	}

	public get minVersion(): number {
		return this.$project.requiredAndroidApiLevel;
	}
}
$injector.register("emulatorSettingsService", EmulatorSettingsService);
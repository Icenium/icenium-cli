///<reference path="../.d.ts"/>

export class EmulatorSettingsService implements Mobile.IEmulatorSettingsService {
	private static CORDOVA_REQURED_ANDROID_APILEVEL = 10; // 2.3 Gingerbread
	private static NATIVESCRIPT_REQURED_ANDROID_APILEVEL = 17; // 4.2 JellyBean

	constructor(private $project: Project.IProject,
		private $projectTypes: IProjectTypes) { }

	public canStart(platform: string): IFuture<boolean> {
		return (() => {
			return _.contains(this.$project.projectTargets.wait(), platform.toLowerCase());
		}).future<boolean>()();
	}

	public get minVersion(): number {
		if(this.$project.projectType === this.$projectTypes.Cordova) {
			return EmulatorSettingsService.CORDOVA_REQURED_ANDROID_APILEVEL;
		}

		return EmulatorSettingsService.NATIVESCRIPT_REQURED_ANDROID_APILEVEL;
	}
}
$injector.register("emulatorSettingsService", EmulatorSettingsService);
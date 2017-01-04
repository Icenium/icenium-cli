export class EmulatorSettingsService implements Mobile.IEmulatorSettingsService {
	constructor(private $project: Project.IProject,
		private $errors: IErrors) { }

	public async canStart(platform: string): Promise<boolean> {
		if (this.$project.capabilities.emulate) {
			return _.includes(this.$project.getProjectTargets(), platform.toLowerCase());
		}

		this.$errors.fail("The operation is not supported for %s projects.", this.$project.projectData.Framework);
	}

	public get minVersion(): number {
		return this.$project.requiredAndroidApiLevel;
	}
}

$injector.register("emulatorSettingsService", EmulatorSettingsService);

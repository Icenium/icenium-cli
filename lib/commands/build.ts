import { EnsureProjectCommand } from "./ensure-project-command";

export class BuildAndroidCommand extends EnsureProjectCommand {
	constructor(protected $project: Project.IProject,
		protected $errors: IErrors,
		private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
		super($project, $errors);
	}

	public async execute(args: string[]): Promise<void> {
		await this.$buildService.executeBuild(this.$devicePlatformsConstants.Android);
	}
}

$injector.registerCommand("build|android", BuildAndroidCommand);

export class BuildIosCommand extends EnsureProjectCommand {
	constructor(protected $project: Project.IProject,
		protected $errors: IErrors,
		private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $options: IOptions) {
		super($project, $errors);
	}

	public async execute(args: string[]): Promise<void> {
		await this.$buildService.executeBuild(this.$devicePlatformsConstants.iOS, { buildForiOSSimulator: this.$options.emulator });
	}
}

$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildWP8Command extends EnsureProjectCommand {
	constructor(protected $project: Project.IProject,
		protected $errors: IErrors,
		private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig) {
		super($project, $errors);
	}

	public async execute(args: string[]): Promise<void> {
		await this.$buildService.executeBuild(this.$devicePlatformsConstants.WP8);
	}

	public isDisabled = this.$config.ON_PREM;
}

$injector.registerCommand("build|wp8", BuildWP8Command);

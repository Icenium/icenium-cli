import { EnsureProjectCommand } from "./ensure-project-command";
import Future = require("fibers/future");

class LiveSyncCommandBase extends EnsureProjectCommand {
	constructor(protected $liveSyncService: ILiveSyncService,
		private $options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public execute(args: string[]): IFuture<void> {
		this.$options.justlaunch = !this.$options.watch;
		return Future.fromResult();
	}

	public allowedParameters: ICommandParameter[] = [];
}

class LiveSyncDevicesCommand extends LiveSyncCommandBase {
	constructor($liveSyncService: ILiveSyncService,
		$options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
		super($liveSyncService, $options, $project, $errors);
	}

	public async execute(args: string[]): Promise<void> {
			await super.execute(args);
			await this.$liveSyncService.livesync();
	}

}

$injector.registerCommand(["livesync|*devices", "live-sync|*devices"], LiveSyncDevicesCommand);

class LiveSyncAndroidCommand extends LiveSyncCommandBase {
	constructor(private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$liveSyncService: ILiveSyncService,
		$options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
		super($liveSyncService, $options, $project, $errors);
	}

	public async execute(args: string[]): Promise<void> {
			await super.execute(args);
			await this.$liveSyncService.livesync(this.$devicePlatformsConstants.Android);
	}
}

$injector.registerCommand(["livesync|android", "live-sync|android"], LiveSyncAndroidCommand);

class LiveSyncIosCommand extends LiveSyncCommandBase {
	constructor(private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$liveSyncService: ILiveSyncService,
		$options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
		super($liveSyncService, $options, $project, $errors);
	}

	public async execute(args: string[]): Promise<void> {
			await super.execute(args);
			await this.$liveSyncService.livesync(this.$devicePlatformsConstants.iOS);
	}

	allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand(["livesync|ios", "live-sync|ios"], LiveSyncIosCommand);

class LiveSyncWP8Command extends LiveSyncCommandBase {
	constructor(private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig,
		$liveSyncService: ILiveSyncService,
		$options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
		super($liveSyncService, $options, $project, $errors);
	}

	public async execute(args: string[]): Promise<void> {
			await super.execute(args);
			await this.$liveSyncService.livesync(this.$devicePlatformsConstants.WP8);
	}

	public isDisabled = this.$config.ON_PREM;
}

$injector.registerCommand(["livesync|wp8", "live-sync|wp8"], LiveSyncWP8Command);

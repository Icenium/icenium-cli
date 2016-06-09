import { EnsureProjectCommand } from "./ensure-project-command";

class LiveSyncDevicesCommand extends EnsureProjectCommand {
	constructor(private $liveSyncService: ILiveSyncService,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand(["livesync|*devices", "live-sync|*devices"], LiveSyncDevicesCommand);

class LiveSyncAndroidCommand extends EnsureProjectCommand {
	constructor(private $liveSyncService: ILiveSyncService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync(this.$devicePlatformsConstants.Android);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand(["livesync|android", "live-sync|android"], LiveSyncAndroidCommand);

class LiveSyncIosCommand extends EnsureProjectCommand {
	constructor(private $liveSyncService: ILiveSyncService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync(this.$devicePlatformsConstants.iOS);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand(["livesync|ios", "live-sync|ios"], LiveSyncIosCommand);

class LiveSyncWP8Command extends EnsureProjectCommand {
	constructor(private $liveSyncService: ILiveSyncService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync(this.$devicePlatformsConstants.WP8);
	}

	allowedParameters: ICommandParameter[] = [];

	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand(["livesync|wp8", "live-sync|wp8"], LiveSyncWP8Command);

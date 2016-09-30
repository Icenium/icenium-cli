import { EnsureProjectCommandWithoutArgs } from "./ensure-project-command-without-args";
import Future = require("fibers/future");

class LiveSyncCommandBase extends EnsureProjectCommandWithoutArgs {
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

	public execute(args: string[]): IFuture<void> {
		return (() => {
			super.execute(args).wait();
			this.$liveSyncService.livesync().wait();
		}).future<void>()();
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

	public execute(args: string[]): IFuture<void> {
		return (() => {
			super.execute(args).wait();
			this.$liveSyncService.livesync(this.$devicePlatformsConstants.Android).wait();
		}).future<void>()();
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

	public execute(args: string[]): IFuture<void> {
		return (() => {
			super.execute(args).wait();
			this.$liveSyncService.livesync(this.$devicePlatformsConstants.iOS).wait();
		}).future<void>()();
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

	public execute(args: string[]): IFuture<void> {
		return (() => {
			super.execute(args).wait();
			this.$liveSyncService.livesync(this.$devicePlatformsConstants.WP8).wait();
		}).future<void>()();
	}

	public isDisabled = this.$config.ON_PREM;
}

$injector.registerCommand(["livesync|wp8", "live-sync|wp8"], LiveSyncWP8Command);

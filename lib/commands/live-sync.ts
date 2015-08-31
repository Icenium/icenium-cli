///<reference path="../.d.ts"/>
"use strict";

interface IProjectFileInfo {
	fileName: string;
	onDeviceName: string;
	shouldIncludeFile: boolean;
}

class LiveSyncDevicesCommand implements ICommand {
	constructor(private $liveSyncService: ILiveSyncService) { }
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand(["livesync|*devices", "live-sync|*devices"], LiveSyncDevicesCommand);

class LiveSyncAndroidCommand implements ICommand {
	constructor(private $liveSyncService: ILiveSyncService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync(this.$devicePlatformsConstants.Android);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand(["livesync|android", "live-sync|android"], LiveSyncAndroidCommand);

class LiveSyncIosCommand implements ICommand {
	constructor(private $liveSyncService: ILiveSyncService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync(this.$devicePlatformsConstants.iOS);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand(["livesync|ios", "live-sync|ios"], LiveSyncIosCommand);

class LiveSyncWP8Command implements ICommand {
	constructor(private $liveSyncService: ILiveSyncService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig) { }
	execute(args: string[]): IFuture<void> {
		return this.$liveSyncService.livesync(this.$devicePlatformsConstants.WP8);
	}

	allowedParameters: ICommandParameter[] = [];

	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand(["livesync|wp8", "live-sync|wp8"], LiveSyncWP8Command);

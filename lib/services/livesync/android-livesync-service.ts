///<reference path="../../.d.ts"/>
"use strict";

import androidLiveSyncServiceLib = require("../../common/mobile/android/android-livesync-service");
import Future = require("fibers/future");

export class AndroidLiveSyncService extends androidLiveSyncServiceLib.AndroidLiveSyncService implements IPlatformLiveSyncService {
	constructor(private _device: Mobile.IDevice,
		private $config: IConfiguration,
		private $errors: IErrors,
	 	$fs: IFileSystem,
		private $injector: IInjector,
		$mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $project: Project.IProject,
		private $server: Server.IServer) {
			super(<Mobile.IAndroidDevice>_device, $fs, $mobileHelper);
		}

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData): IFuture<void> {
		return (() => {
			let commands = [ this.liveSyncCommands.SyncFilesCommand() ];
			if(this.$options.watch || this.$options.file) {
				commands.push(this.liveSyncCommands.RefreshCurrentViewCommand());
			} else {
				commands.push(this.liveSyncCommands.ReloadStartViewCommand());
			}

			this.livesync(deviceAppData.appIdentifier, deviceAppData.deviceProjectRootPath, commands).wait();
		}).future<void>()();
	}

	public removeFiles(): IFuture<void> {
		return Future.fromResult();
	}
}
$injector.register("androidLiveSyncServiceLocator", {factory: AndroidLiveSyncService});

///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");

export class LiveSyncProvider implements ILiveSyncProvider {
	constructor(private $androidLiveSyncServiceLocator: {factory: Function},
		private $iosLiveSyncServiceLocator: {factory: Function},
		private $buildService: Project.IBuildService,
		private $devicesService: Mobile.IDevicesService,
		private $options: IOptions) { }

	public get platformSpecificLiveSyncServices(): IDictionary<any> {
		return {
			android: (_device: Mobile.IDevice, $injector: IInjector): IPlatformLiveSyncService => {
				return $injector.resolve(this.$androidLiveSyncServiceLocator.factory, {_device: _device});
			},
			ios: (_device: Mobile.IDevice, $injector: IInjector) => {
				return $injector.resolve(this.$iosLiveSyncServiceLocator.factory, {_device: _device});
			}
		};
	}

	public buildForDevice(device: Mobile.IDevice): IFuture<string> {
		return this.$devicesService.isiOSSimulator(device) ?
			Future.fromResult("//Users//havaluova//Work//icenium-cli//scratch//myiSimApp//Cordova370.app") :
			Future.fromResult("//Users//havaluova//Work//icenium-cli//scratch//myiSimApp//app.ipa");
		/* return this.$devicesService.isiOSSimulator(device) ? this.$buildService.buildForiOSSimulator(this.$options.saveTo, device)
			: this.$buildService.buildForDeploy(this.$devicesService.platform, this.$options.saveTo, false, device); */
	}

	public preparePlatformForSync(platform: string): IFuture<void> {
		return Future.fromResult();
	}

	public canExecuteFastSync(filePath: string): boolean {
		return false;
	}
}
$injector.register("liveSyncProvider", LiveSyncProvider);

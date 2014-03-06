///<reference path="../.d.ts"/>

import util = require("util");
import options = require("./../options");

export class ListDevicesCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var index = 1;
			var platform = this.$devicesServices.checkPlatformAndDevice(args[0], undefined).wait();

			var action;
			if (options.json) {
				this.$logger.setLevel("ERROR");
				action = (device: Mobile.IDevice): IFuture<void> => {
					return (() => { this.$logger.out(JSON.stringify({ identifier: device.getIdentifier(), platform: device.getPlatform() })) }).future<void>()();
				};
			} else {
				action = (device: Mobile.IDevice): IFuture<void> => {
					return (() => { this.$logger.out("#%d: '%s'", index++, device.getDisplayName(), device.getPlatform()); }).future<void>()();
				};
			}

			this.$devicesServices.executeOnAllConnectedDevices(action, platform).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("list-devices", ListDevicesCommand);

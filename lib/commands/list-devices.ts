///<reference path="../.d.ts"/>

import util = require("util");

export class ListDevicesCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices) {
	}

	public execute(args: string[]): IFuture<void> {
		return(() => {
			var index = 1,
				platform = args[0];

			var action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => { console.log(util.format("#%d: '%s'", index++, device.getDisplayName()), device.getPlatform()); }).future<void>()();
			};

			this.$devicesServices.executeOnAllConnectedDevices(action, platform).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("list-devices", ListDevicesCommand);

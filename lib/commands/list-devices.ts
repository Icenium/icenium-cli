///<reference path="../.d.ts"/>

import util = require("util");

export class ListDevicesCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger) {
	}

	public execute(args: string[]): void {
		(() => {
			var index = 1;
			var platform = args[0];

			var action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => { this.$logger.out("#%d: '%s'", index++, device.getDisplayName(), device.getPlatform()); }).future<void>()();
			};

			this.$devicesServices.executeOnAllConnectedDevices(action, platform).wait();
		}).future<void>()().wait();
	}
}
$injector.registerCommand("list-devices", ListDevicesCommand);

///<reference path="../.d.ts"/>

import util = require("util");
import options = require("./../options");

export class ListDevicesCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $server: Server.IServer,
		private $fs: IFileSystem) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var index = 1;
			this.$devicesServices.initialize(args[0], null, {skipInferPlatform: true}).wait();

			var action;
			if (options.json) {
				this.$logger.setLevel("ERROR");
				action = (device: Mobile.IDevice): IFuture<void> => {
					return (() => { this.$logger.out(JSON.stringify({
							identifier: device.getIdentifier(),
							platform: device.getPlatform(),
							model: device.getModel(),
							name: device.getDisplayName(),
							version: device.getVersion(),
							vendor: device.getVendor()
						}))}).future<void>()();
				};
			} else {
				action = (device: Mobile.IDevice): IFuture<void> => {
					return (() => { this.$logger.out("#%d: '%s'", index++, device.getDisplayName(), device.getPlatform(), device.getIdentifier()); }).future<void>()();
				};
			}

			var filename = "user-settings-test";
			var file = this.$fs.createWriteStream(filename);

			this.$server.rawSettings.getUserSettings(file).wait();

			this.$devicesServices.execute(action, undefined, {allowNoDevices: true}).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("list-devices", ListDevicesCommand);

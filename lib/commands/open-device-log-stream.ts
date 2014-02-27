///<reference path="../.d.ts"/>
import options = require("./../options");
import helpers = require("./../helpers");

export class OpenDeviceLogStreamCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $errors: IErrors) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var action = (device: Mobile.IDevice) =>  { return (() => device.openDeviceLogStream()).future<void>()(); };
			this.$devicesServices.executeOnDevice(action, options.device).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("open-device-log-stream", OpenDeviceLogStreamCommand);



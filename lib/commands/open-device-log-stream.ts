///<reference path="../.d.ts"/>
import options = require("./../options");
import helpers = require("./../helpers");

export class OpenDeviceLogStreamCommand implements ICommand {
	private static NOT_SPECIFIED_DEVICE_ERROR_MESSAGE = "Please specify the device (with option --device \<identifier\ or index>). Run '$ appbuilder list-devices' command to see all connected devices";

	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $errors: IErrors) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(!options.device) {
				this.$errors.fail(OpenDeviceLogStreamCommand.NOT_SPECIFIED_DEVICE_ERROR_MESSAGE);
			}

			var action = (device: Mobile.IDevice) =>  { return (() => device.openDeviceLogStream()).future<void>()(); };
			this.$devicesServices.execute(action).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("open-device-log-stream", OpenDeviceLogStreamCommand);



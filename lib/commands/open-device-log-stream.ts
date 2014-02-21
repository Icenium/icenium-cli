///<reference path="../.d.ts"/>
import options = require("./../options");
import helpers = require("./../helpers");

export class OpenDeviceLogStreamCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger) {
	}

	public execute(args: string[]): IFuture<void> {
		return(() => {
			var action = (device: Mobile.IDevice) =>  { device.openDeviceLogStream(); };
			if(this.$devicesServices.hasDevice(options.device)) {
				this.$devicesServices.executeOnDevice(action, options.device).wait();
			} else if(helpers.isNumber(options.device)) {
				this.$devicesServices.executeOnDevice(action, undefined, parseInt(options.device, 10)).wait();
			} else {
				this.$logger.fatal("Invalid device identifier or index. Run $ice list-devices command to see all connected devices.");
			}
		}).future<void>()();
	}
}
$injector.registerCommand("open-device-log-stream", OpenDeviceLogStreamCommand);



///<reference path="../.d.ts"/>
import options = require("./../options");
import helpers = require("./../helpers");

export class OpenDeviceLogStreamCommand implements ICommand {
	private static NOT_SPECIFIED_DEVICE_ERROR_MESSAGE = "More than one device found. Specify device explicitly.";

	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $errors: IErrors,
		private $commandsService: ICommandsService) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$devicesServices.initialize(undefined, options.device, {skipInferPlatform: true}).wait();

			if (this.$devicesServices.deviceCount > 1) {
				this.$commandsService.executeCommand("list-devices", []);
				this.$errors.fail(OpenDeviceLogStreamCommand.NOT_SPECIFIED_DEVICE_ERROR_MESSAGE);
			}

			var action = (device: Mobile.IDevice) =>  { return (() => device.openDeviceLogStream()).future<void>()(); };
			this.$devicesServices.execute(action).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("open-device-log-stream", OpenDeviceLogStreamCommand);



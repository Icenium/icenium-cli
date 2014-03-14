///<reference path="../.d.ts"/>
import options = require("./../options");
import helpers = require("./../helpers");

export class OpenDeviceLogStreamCommand implements ICommand {
	private static NOT_SPECIFIED_DEVICE_ERROR_MESSAGE = "Please specify the device (with option --device \<identifier\ or index>)";

	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $errors: IErrors,
		private $commandsService: ICommandsService) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if (!options.device) {
				this.$commandsService.executeCommand("list-devices", []);
				this.$errors.fail(OpenDeviceLogStreamCommand.NOT_SPECIFIED_DEVICE_ERROR_MESSAGE);
			}
			this.$devicesServices.initialize(undefined, options.device).wait();
			var action = (device: Mobile.IDevice): IFuture<void> =>  { return device.openDeviceLogStream(); };
			this.$devicesServices.execute(action).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("open-device-log-stream", OpenDeviceLogStreamCommand);



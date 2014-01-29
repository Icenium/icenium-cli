///<reference path="../.d.ts"/>
import options = require("./../options");
import helpers = require("./../helpers");
import baseCommands = require("./base-commands");

export class OpenDeviceLogStreamCommandData implements Commands.ICommandData {
	constructor(private keywords: string[]) { }
	public get Keywords() {
		return this.keywords;
	}
}

export class OpenDeviceLogStreamCommandDataFactory implements Commands.ICommandDataFactory {
	public fromCliArguments(args: string[]): OpenDeviceLogStreamCommandData {
		return new OpenDeviceLogStreamCommandData(args);
	}
}
$injector.register("openDeviceLogStreamCommandDataFactory", OpenDeviceLogStreamCommandDataFactory);

export class OpenDeviceLogStreamCommand extends baseCommands.BaseCommand<OpenDeviceLogStreamCommandData> {
	constructor(private $openDeviceLogStreamCommandDataFactory: OpenDeviceLogStreamCommandDataFactory,
		private $devicesServices: Mobile.IDevicesServices) {
		super();
	}

	public getDataFactory(): OpenDeviceLogStreamCommandDataFactory {
		return this.$openDeviceLogStreamCommandDataFactory;
	}

	public execute(data: OpenDeviceLogStreamCommandData): void {
		var action = (device: Mobile.IDevice) =>  { device.openDeviceLogStream(); };
		if(helpers.isNumber(options.device)) {
			this.$devicesServices.executeOnDevice(action, undefined, parseInt(options.device, 10)).wait();
		} else {
			this.$devicesServices.executeOnDevice(action, options.device).wait();
		}
	}
}
$injector.registerCommand("open-device-log-stream", OpenDeviceLogStreamCommand);



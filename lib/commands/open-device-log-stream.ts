///<reference path="../.d.ts"/>
import options = require("./../options");
import helpers = require("./../helpers");

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

export class OpenDeviceLogStreamCommand implements Commands.ICommand<OpenDeviceLogStreamCommandData> {
	constructor(private openDeviceLogStreamCommandDataFactory: OpenDeviceLogStreamCommandDataFactory,
				private devicesServices: Mobile.IDevicesServices,
				private logger: ILogger) { }

	public getDataFactory(): OpenDeviceLogStreamCommandDataFactory {
		return this.openDeviceLogStreamCommandDataFactory;
	}

	public canExecute(): boolean {
		return true;
	}

	public execute(data: OpenDeviceLogStreamCommandData): void {
		var action = (device: Mobile.IDevice) =>  { device.openDeviceLogStream(); };
		if(helpers.isNumber(options.device)) {
			this.devicesServices.executeOnDevice(action, undefined, parseInt(options.device));
		} else {
			this.devicesServices.executeOnDevice(action, options.device);
		}
	}
}
$injector.registerCommand("open-device-log-stream", OpenDeviceLogStreamCommand);



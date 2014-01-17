///<reference path="../.d.ts"/>

import util = require("util");

export class ListDevicesCommandData implements Commands.ICommandData {
	constructor(private keywords: string[]) { }
	public get Keywords() {
		return this.keywords;
	}
}

export class ListDevicesCommandDataFactory implements  Commands.ICommandDataFactory {
	public fromCliArguments(args: string[]) : ListDevicesCommandData {
		return new ListDevicesCommandData(args);
	}
}

$injector.register("listDevicesCommandDataFactory", ListDevicesCommandDataFactory);

export class ListDevicesCommand implements Commands.ICommand<ListDevicesCommandData>  {
	constructor(private listDevicesCommandDataFactory: ListDevicesCommandDataFactory,
				private logger: ILogger,
				private devicesServices: Mobile.IDevicesServices) { }

	public getDataFactory(): ListDevicesCommandDataFactory {
		return this.listDevicesCommandDataFactory;
	}

	public canExecute(data: ListDevicesCommandData): boolean {
		return true;
	}

	public execute(data: ListDevicesCommandData): void {
		var platform = data.Keywords.length === 0 ? undefined : data.Keywords[0];
		var index: number = 1;

		var action = (device: Mobile.IDevice): IFuture<void> => {
			return (() => { console.log(util.format("#%d: '%s'", index++, device.getDisplayName()), device.getPlatform()); }).future<void>()();
		};

		this.devicesServices.executeOnAllConnectedDevices(action, platform).wait();
	}
}

$injector.registerCommand("list-devices", ListDevicesCommand);

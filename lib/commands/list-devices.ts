///<reference path="../.d.ts"/>

import util = require("util");

export class ListDevicesCommandData implements Commands.ICommandData {
	constructor(private keywords: string[]) { }
	public get Platform() {
		return this.keywords[0];
	}
}

export class ListDevicesCommandDataFactory implements  Commands.ICommandDataFactory {
	public fromCliArguments(args: string[]) : ListDevicesCommandData {
		return new ListDevicesCommandData(args);
	}
}

$injector.register("listDevicesCommandDataFactory", ListDevicesCommandDataFactory);

export class ListDevicesCommand implements Commands.ICommand<ListDevicesCommandData>  {
	constructor(private $listDevicesCommandDataFactory: ListDevicesCommandDataFactory,
		private $devicesServices: Mobile.IDevicesServices) { }

	public getDataFactory(): ListDevicesCommandDataFactory {
		return this.$listDevicesCommandDataFactory;
	}

	public canExecute(data: ListDevicesCommandData): boolean {
		return true;
	}

	public execute(data: ListDevicesCommandData): void {
		var index = 1;

		var action = (device: Mobile.IDevice): IFuture<void> => {
			return (() => { console.log(util.format("#%d: '%s'", index++, device.getDisplayName()), device.getPlatform()); }).future<void>()();
		};

		this.$devicesServices.executeOnAllConnectedDevices(action, data.Platform).wait();
	}
}

$injector.registerCommand("list-devices", ListDevicesCommand);

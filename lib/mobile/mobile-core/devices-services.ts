///<reference path="./../../.d.ts"/>

import Q = require("q");
import Signal = require("./../../events/signal");
import _ = require("underscore");
import util = require("util");
import Future = require("fibers/future");
import MobileHelper = require("./../mobile-helper");

export class DevicesServices implements Mobile.IDevicesServices {
	private devices: { [key: string]: Mobile.IDevice } = {};
	private platforms: Array<string> = new Array<string>();
	private missingIdentifierAndIndexErrorMessage = "Please specify --device \<identifier\ or index>. Run $ice list-devices command to see all connected devices";
	private notFoundDeviceByIdentifierErrorMessage = "Not found device with identifier '%s'";
	private notFoundDeviceByIndexErrorMessage = "Invalid index %d.";

	constructor(private logger: ILogger, private iOSDeviceDiscovery: Mobile.IDeviceDiscovery, private androidDeviceDiscovery: Mobile.IDeviceDiscovery) {
		this.attachToDeviceDiscoveryEvents()
	}

	public getDevices(): Mobile.IDevice[] {
		return _.values(this.devices);
	}

	private getAllPlatforms(): Array<string> {
		if(this.platforms.length > 0) {
			return this.platforms;
		}

		var devicePlatforms = MobileHelper.DevicePlatforms;
		for (var platform in devicePlatforms) {
			if(typeof devicePlatforms[platform] === "number") {
				this.platforms.push(platform.toString().toLowerCase());
			}
		}

		return this.platforms;
	}

	private getPlatform(platform: string): string {
		var allSupportedPlatforms = this.getAllPlatforms();
		platform = platform.toLowerCase();
		if(!allSupportedPlatforms.contains(platform)) {
			throw new Error(util.format("The platform %s is not supported", platform));
		}

		return platform;
	}

	attachToDeviceDiscoveryEvents() {
		this.iOSDeviceDiscovery.deviceFound.add(this.onDeviceFound, this);
		this.iOSDeviceDiscovery.deviceLost.add(this.onDeviceLost, this);

		this.androidDeviceDiscovery.deviceFound.add(this.onDeviceFound, this);
		this.androidDeviceDiscovery.deviceLost.add(this.onDeviceLost, this);
	}

	private onDeviceFound(device: Mobile.IDevice): void {
		this.logger.trace("Found device with identifier '%s'", device.getIdentifier());
		this.devices[device.getIdentifier()] = device;
	}

	private onDeviceLost(device: Mobile.IDevice): void {
		this.logger.trace("Lost device with identifier '%s'", device.getIdentifier());
		delete this.devices[device.getIdentifier()];
	}

	private startLookingForDevices(platform?: string): void {
		if(platform === undefined) {
			this.iOSDeviceDiscovery.startLookingForDevices();
			this.androidDeviceDiscovery.startLookingForDevices();
		} else if(platform.toLowerCase() === "ios") {
			this.iOSDeviceDiscovery.startLookingForDevices();
		} else if(platform.toLowerCase() === "android") {
			this.androidDeviceDiscovery.startLookingForDevices();
		}
	}

	private getAllConnectedDevices(platform?: string, timeoutInSeconds?: number): Mobile.IDevice[] {
		this.startLookingForDevices(platform);
		if(platform === undefined) {
			return this.getDevices();
		} else {
			return this.filterDevicesByPlatform(this.getPlatform(platform));
		}
	}

	private getDeviceByIndex(index: number): Mobile.IDevice {
		this.validateIndex(index-1);
		return this.getDevices()[index-1];
	}

	private getDeviceByIdentifier(identifier: string): Mobile.IDevice {
		var devicesFromSpecifiedPlatform = this.getDevices().filter(function(device: Mobile.IDevice){ return device.getIdentifier() === identifier});
		if(devicesFromSpecifiedPlatform.length === 0) {
			throw new Error(util.format(this.notFoundDeviceByIdentifierErrorMessage, identifier));
		}

		return devicesFromSpecifiedPlatform[0];
	}

	public executeOnDevice(action: any, identifier?: string, index?: number): void {
		this.startLookingForDevices();

		if (identifier === undefined && index === undefined) {
			console.log(this.missingIdentifierAndIndexErrorMessage);
			return;
		} else if (identifier) {
			action(this.getDeviceByIdentifier(identifier));
		} else if (index) {
			action(this.getDeviceByIndex(index));
		}
	}

	public executeOnAllConnectedDevices(action: (dev: Mobile.IDevice) => IFuture<any>, platform?: string, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void> {
		return(() => {
			var allConnectedDevices = this.getAllConnectedDevices(platform);
			var listers: IFuture<any>[] = _.map(allConnectedDevices, (device: Mobile.IDevice) => {
				if(canExecute !== undefined) {
					if(canExecute(device)) {
						return action(device);
					}
				} else {
					return action(device);
				}
			});

			Future.wait(listers);
		}).future<void>()();
	}
	public hasDevices(platform?: string): boolean {

		if (platform === undefined) {
			return this.getDevices().length === 0;
		} else {
			return this.filterDevicesByPlatform(this.getPlatform(platform)).length === 0;
		}
	}

	private filterDevicesByPlatform(platform: string): Mobile.IDevice[] {
		return this.getDevices().filter( (device: Mobile.IDevice) => { return device.getPlatform() === platform;});
	}

	private validateIndex(index: number, devices: Mobile.IDevice[]= null): void {
		index = parseInt(index.toString(), 10);
		if (index < 0 || index > this.getDevices().length) {
			throw new Error(util.format(this.notFoundDeviceByIndexErrorMessage, index));
		}
	}
}

$injector.register("devicesServices", DevicesServices);

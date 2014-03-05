///<reference path="./../../.d.ts"/>

import Signal = require("./../../events/signal");
import _ = require("underscore");
import util = require("util");
import Future = require("fibers/future");
import MobileHelper = require("./../mobile-helper");
import helpers = require("./../../helpers");

export class DevicesServices implements Mobile.IDevicesServices {
	private devices: { [key: string]: Mobile.IDevice } = {};
	private platforms: string[] = [];
	private static NOT_SPECIFIED_DEVICE_ERROR_MESSAGE = "Please specify the device (with option --device \<identifier\ or index>). Run '$ appbuilder list-devices' command to see all connected devices";
	private static NOT_FOUND_DEVICE_BY_IDENTIFIER_ERROR_MESSAGE = "Could not find device with identifier '%s'";
	private static NOT_FOUND_DEVICE_BY_INDEX_ERROR_MESSAGE = "Could not find device with index %d.";

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $iOSDeviceDiscovery: Mobile.IDeviceDiscovery,
		private $androidDeviceDiscovery: Mobile.IDeviceDiscovery) {
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
				this.platforms.push(platform.toLowerCase());
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
		this.$iOSDeviceDiscovery.deviceFound.add(this.onDeviceFound, this);
		this.$iOSDeviceDiscovery.deviceLost.add(this.onDeviceLost, this);

		this.$androidDeviceDiscovery.deviceFound.add(this.onDeviceFound, this);
		this.$androidDeviceDiscovery.deviceLost.add(this.onDeviceLost, this);
	}

	private onDeviceFound(device: Mobile.IDevice): void {
		this.$logger.trace("Found device with identifier '%s'", device.getIdentifier());
		this.devices[device.getIdentifier()] = device;
	}

	private onDeviceLost(device: Mobile.IDevice): void {
		this.$logger.trace("Lost device with identifier '%s'", device.getIdentifier());
		delete this.devices[device.getIdentifier()];
	}

	private startLookingForDevices(platform?: string): IFuture<void> {
		return (() => {
			if(!platform) {
				this.$iOSDeviceDiscovery.startLookingForDevices();
				this.$androidDeviceDiscovery.startLookingForDevices().wait();
			} else if(MobileHelper.isiOSPlatform(platform)) {
				this.$iOSDeviceDiscovery.startLookingForDevices();
			} else if(MobileHelper.isAndroidPlatform(platform)) {
				this.$androidDeviceDiscovery.startLookingForDevices().wait();
			}
		}).future<void>()();
	}

	private getAllConnectedDevices(platform?: string, timeoutInSeconds?: number): Mobile.IDevice[] {
		if(!platform) {
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
		var searchedDevice = _.find(this.getDevices(), (device: Mobile.IDevice) => { return device.getIdentifier() === identifier; });
		if(!searchedDevice) {
			throw new Error(util.format(DevicesServices.NOT_FOUND_DEVICE_BY_IDENTIFIER_ERROR_MESSAGE, identifier));
		}

		return searchedDevice;
	}

	public executeOnDevice(action: any, deviceOptions: string, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void> {
		return (() => {
			this.$logger.debug("executeOnDevice: '%s'", deviceOptions);

			if(!deviceOptions) {
				this.$errors.fail(DevicesServices.NOT_SPECIFIED_DEVICE_ERROR_MESSAGE);
				return;
			}

			this.startLookingForDevices().wait();
			var device: Mobile.IDevice = null;
			if(this.hasDevice(deviceOptions)) {
				device = this.getDeviceByIdentifier(deviceOptions);
			} else if(helpers.isNumber(deviceOptions)) {
				device = this.getDeviceByIndex(parseInt(deviceOptions, 10));
			} else {
				this.$errors.fail("Cannot resolve the specified connected device by the provided index or identifier. To list currently connected devices and verify that the specified index or identifier exists, run list-devices.");
			}

			if(!device) {
				this.$errors.fail("Could not find device");
			}

			if(!canExecute || canExecute(device)) {
				return action(device).wait();
			}

		}).future<void>()();
	}

	public executeOnAllConnectedDevices(action: (dev: Mobile.IDevice) => IFuture<any>, platform?: string, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void> {
		return(() => {
			this.startLookingForDevices(platform).wait();
			var allConnectedDevices = this.getAllConnectedDevices(platform);
			if(allConnectedDevices.length == 0) {
				this.$logger.out("No connected devices found.");
			}
			var futures = _.map(allConnectedDevices, (device: Mobile.IDevice) => {
				if (!canExecute || canExecute(device)) {
					var future = action(device);
					Future.settle(future);
					return future;
				} else {
					return Future.fromResult();
				}
			});

			Future.wait(futures);
		}).future<void>()();
	}

	public hasDevices(platform?: string): boolean {
		if (!platform) {
			return this.getDevices().length === 0;
		} else {
			return this.filterDevicesByPlatform(this.getPlatform(platform)).length === 0;
		}
	}

	public hasDevice(identifier: string): boolean {
		return _.some(this.getDevices(), (device: Mobile.IDevice) => { return device.getIdentifier() === identifier });
	}

	private filterDevicesByPlatform(platform: string): Mobile.IDevice[] {
		return _.filter(this.getDevices(), (device: Mobile.IDevice) => { return device.getPlatform() === platform; });
	}

	private validateIndex(index: number): void {
		if (index < 0 || index > this.getDevices().length) {
			throw new Error(util.format(DevicesServices.NOT_FOUND_DEVICE_BY_INDEX_ERROR_MESSAGE, index));
		}
	}
}

$injector.register("devicesServices", DevicesServices);

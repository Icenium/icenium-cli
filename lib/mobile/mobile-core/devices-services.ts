///<reference path="./../../.d.ts"/>

import Signal = require("./../../events/signal");
import _ = require("underscore");
import util = require("util");
import Future = require("fibers/future");
import MobileHelper = require("./../mobile-helper");
import helpers = require("./../../helpers");
var assert = require("assert");

export class DevicesServices implements Mobile.IDevicesServices {
	private devices: { [key: string]: Mobile.IDevice } = {};
	private platforms: string[] = [];
	private static NOT_FOUND_DEVICE_BY_IDENTIFIER_ERROR_MESSAGE = "Could not find device by specified identifier '%s'. To list currently connected devices and verify that the specified identifier exists, run list-devices.";
	private static NOT_FOUND_DEVICE_BY_INDEX_ERROR_MESSAGE = "Could not find device by specified index %d. To list currently connected devices and verify that the specified index exists, run list-devices.";
	private _platform: string;
	private _device: Mobile.IDevice;
	private _isInitialized = false;

	constructor(private $logger: ILogger,
		private $errors: IErrors,
		private $iOSDeviceDiscovery: Mobile.IDeviceDiscovery,
		private $androidDeviceDiscovery: Mobile.IDeviceDiscovery) {
		this.attachToDeviceDiscoveryEvents()
	}

	public get platform(): string {
		return this._platform;
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
			this.$errors.fail("The platform %s is not supported", platform);
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

	private startLookingForDevices(): IFuture<void> {
		return (() => {
			if(!this._platform) {
				this.$iOSDeviceDiscovery.startLookingForDevices();
				this.$androidDeviceDiscovery.startLookingForDevices().wait();
			} else if(MobileHelper.isiOSPlatform(this._platform)) {
				this.$iOSDeviceDiscovery.startLookingForDevices();
			} else if(MobileHelper.isAndroidPlatform(this._platform)) {
				this.$androidDeviceDiscovery.startLookingForDevices().wait();
			}
			this._isInitialized = true;
		}).future<void>()();
	}

	private getAllConnectedDevices(): Mobile.IDevice[] {
		if(!this._platform) {
			return this.getDevices();
		} else {
			return this.filterDevicesByPlatform();
		}
	}

	private getDeviceByIndex(index: number): Mobile.IDevice {
		this.validateIndex(index-1);
		return this.getDevices()[index-1];
	}

	private getDeviceByIdentifier(identifier: string): Mobile.IDevice {
		var searchedDevice = _.find(this.getDevices(), (device: Mobile.IDevice) => { return device.getIdentifier() === identifier; });
		if(!searchedDevice) {
			this.$errors.fail(DevicesServices.NOT_FOUND_DEVICE_BY_IDENTIFIER_ERROR_MESSAGE, identifier);
		}

		return searchedDevice;
	}

	private getDevice(deviceOption: string): IFuture<Mobile.IDevice> {
		return (() => {
			this.startLookingForDevices().wait();
			var device: Mobile.IDevice = null;

			if(this.hasDevice(deviceOption)) {
				device = this.getDeviceByIdentifier(deviceOption);
			} else if(helpers.isNumber(deviceOption)) {
				device = this.getDeviceByIndex(parseInt(deviceOption, 10));
			} else {
				this.$errors.fail("Cannot resolve the specified connected device by the provided index or identifier. To list currently connected devices and verify that the specified index or identifier exists, run list-devices.");
			}

			return device;
		}).future<Mobile.IDevice>()();
	}

	private executeOnDevice(action: any, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void> {
		return (() => {
			if(!canExecute || canExecute(this._device)) {
				return action(this._device).wait();
			}
		}).future<void>()();
	}

	private executeOnAllConnectedDevices(action: (dev: Mobile.IDevice) => IFuture<any>, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void> {
		return(() => {
			var allConnectedDevices = this.getAllConnectedDevices();
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

	public execute(action: (device: Mobile.IDevice) => IFuture<any>, canExecute?: (dev: Mobile.IDevice) => boolean, options?: {[key: string]: boolean}): IFuture<void> {
		return (() => {
			assert.ok(this._isInitialized, "Devices services not initialized!");
			if(this.hasDevices()) {
				if(this._device) {
					this.executeOnDevice(action, canExecute).wait();
				} else {
					this.executeOnAllConnectedDevices(action, canExecute).wait();
				}
			} else {
				var message = "Cannot find connected devices. Reconnect any connected devices, verify that your system recognizes them, and run this command again";
				if(options && options["allowNoDevices"]) {
					this.$logger.info(message);
				} else {
					this.$errors.fail(message);
				}
			}
		}).future<void>()();
	}

	public initialize(platform: string, deviceOption?: string): IFuture<void> {
		return(() => {
			if(platform && deviceOption) {
				this._device = this.getDevice(deviceOption).wait();
				this._platform = this._device.getPlatform();
				if(this._platform !== this.getPlatform(platform)) {
					this.$errors.fail("Cannot resolve the specified connected device. The provided platform does not match the provided index or identifier." +
						"To list currently connected devices and verify that the specified pair of platform and index or identifier exists, run list-devices.");
				}
				this.$logger.warn("Your application will be deployed only on the device specified by the provided index or identifier.");
			} else if(!platform && deviceOption) {
				this._device = this.getDevice(deviceOption).wait();
				this._platform = this._device.getPlatform();
			} else if(platform && !deviceOption) {
				this._platform = this.getPlatform(platform);
				this.startLookingForDevices().wait();
			} else if(!platform && !deviceOption) {
				this.startLookingForDevices().wait();
			}
		}).future<void>()();
	}

	private hasDevices(): boolean {
		if (!this._platform) {
			return this.getDevices().length !== 0;
		} else {
			return this.filterDevicesByPlatform().length !== 0;
		}
	}

	private hasDevice(identifier: string): boolean {
		return _.some(this.getDevices(), (device: Mobile.IDevice) => { return device.getIdentifier() === identifier });
	}

	private filterDevicesByPlatform(): Mobile.IDevice[] {
		return _.filter(this.getDevices(), (device: Mobile.IDevice) => { return device.getPlatform() === this._platform; });
	}

	private validateIndex(index: number): void {
		if (index < 0 || index > this.getDevices().length) {
			throw new Error(util.format(DevicesServices.NOT_FOUND_DEVICE_BY_INDEX_ERROR_MESSAGE, index));
		}
	}
}

$injector.register("devicesServices", DevicesServices);

///<reference path="./../../.d.ts"/>

import Signal = require("./../../events/signal");
import util = require("util");
import Future = require("fibers/future");
import MobileHelper = require("./../mobile-helper");
import helpers = require("./../../helpers");
var assert = require("assert");
import constants = require("../constants");

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
		this.attachToDeviceDiscoveryEvents();
	}

	public get platform(): string {
		return this._platform;
	}

	public get deviceCount(): number {
		return this._device ? 1 : this.getDevices().length;
	}

	private getDevices(): Mobile.IDevice[] {
		return _.values(this.devices);
	}

	private getAllPlatforms(): Array<string> {
		if(this.platforms.length > 0) {
			return this.platforms;
		}

		var devicePlatforms = MobileHelper.DevicePlatforms;
		for (var platform in devicePlatforms) {
			if(typeof devicePlatforms[platform] === "number") {
				var platformCapabilities = MobileHelper.platformCapabilities[platform];
				if (platformCapabilities.cableDeploy) {
					this.platforms.push(platform);
				}
			}
		}

		return this.platforms;
	}

	private getPlatform(platform: string): string {
		var allSupportedPlatforms = this.getAllPlatforms();
		var normalizedPlatform = MobileHelper.validatePlatformName(platform, this.$errors)
		if(!_.contains(allSupportedPlatforms, normalizedPlatform)) {
			this.$errors.fail("Deploying to %s connected devices is not supported. Build the " +
				"app using the `build` command and deploy the package manually.", normalizedPlatform);
		}

		return normalizedPlatform;
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
			this.$logger.trace("startLookingForDevices; platform is %s", this._platform);
			if(!this._platform) {
				this.$iOSDeviceDiscovery.startLookingForDevices();
				this.$androidDeviceDiscovery.startLookingForDevices().wait();
			} else if(MobileHelper.isiOSPlatform(this._platform)) {
				this.$iOSDeviceDiscovery.startLookingForDevices();
			} else if(MobileHelper.isAndroidPlatform(this._platform)) {
				this.$androidDeviceDiscovery.startLookingForDevices().wait();
			}
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
			}

			if(!device) {
				this.$errors.fail("Cannot resolve the specified connected device by the provided index or identifier. To list currently connected devices and verify that the specified index or identifier exists, run list-devices.");
			}

			return device;
		}).future<Mobile.IDevice>()();
	}

	private executeOnDevice(action: (dev: Mobile.IDevice) => IFuture<void>, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void> {
		return ((): void => {
			if(!canExecute || canExecute(this._device)) {
				action(this._device).wait();
			}
		}).future<void>()();
	}

	private executeOnAllConnectedDevices(action: (dev: Mobile.IDevice) => IFuture<void>, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void> {
		return ((): void => {
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

			Future.wait(futures); //SAFE: all futures settled serially by the above Future.settle call
		}).future<void>()();
	}

	public execute(action: (device: Mobile.IDevice) => IFuture<void>, canExecute?: (dev: Mobile.IDevice) => boolean, options?: {[key: string]: boolean}): IFuture<void> {
		return ((): void => {
			assert.ok(this._isInitialized, "Devices services not initialized!");
			if(this.hasDevices) {
				if(this._device) {
					this.executeOnDevice(action, canExecute).wait();
				} else {
					this.executeOnAllConnectedDevices(action, canExecute).wait();
				}
			} else {
				var message = constants.ERROR_NO_DEVICES;
				if(options && options["allowNoDevices"]) {
					this.$logger.info(message);
				} else {
					this.$errors.fail({formatStr: message, suppressCommandHelp: true});
				}
			}
		}).future<void>()();
	}

	public initialize(platform: string, deviceOption?: string, options?: Mobile.IDevicesServicesInitializationOptions): IFuture<void> {
		options = options || {};
		if (this._isInitialized) {
			return Future.fromResult();
		}
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

				if (!options.skipInferPlatform) {
					var devices = this.getDevices();
					var platforms = _.uniq(_.map(devices, (device) => device.getPlatform()));

					if (platforms.length === 1) {
						this._platform = platforms[0];
					} else {
						if (platforms.length === 0) {
							this.$errors.fail({formatStr: constants.ERROR_NO_DEVICES, suppressCommandHelp: true});
						} else {
							this.$errors.fail("Multiple device platforms detected (%s). Specify platform or device on command line.",
								helpers.formatListOfNames(platforms, "and"));
						}
					}
				}
			}
			this._isInitialized = true;
		}).future<void>()();
	}

	public get hasDevices(): boolean {
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

///<reference path="./../../.d.ts"/>

import _ = require("underscore");
import ref = require("ref");
import util = require("util");
import os = require("os");
import path = require("path");
import IOSDevice = require("./../ios/ios-device");
import AndroidDevice = require("./../android/android-device");
import CoreTypes = require("./../ios/ios-core");
import Signal = require("./../../events/signal");
import Future = require("fibers/future");
import child_process = require("child_process");
import helpers = require("./../../helpers");
var options = require("./../../options");

export class DeviceDiscovery implements Mobile.IDeviceDiscovery {
	private devices: {[key: string]: Mobile.IDevice} = {};

	public deviceFound :ISignal= null;
	public deviceLost: ISignal = null;

	constructor() {
		this.deviceFound =  new Signal.Signal();
		this.deviceLost =  new Signal.Signal();
	}

	public addDevice(device: Mobile.IDevice) {
		this.devices[device.getIdentifier()] = device;
		this.raiseOnDeviceFound(device);
	}

	public removeDevice(deviceIdentifier: string) {
		var device = this.devices[deviceIdentifier];
		if(!device) {
			return;
		}
		delete this.devices[deviceIdentifier];
		this.raiseOnDeviceLost(device);
	}

	private raiseOnDeviceFound(device: Mobile.IDevice) {
		this.deviceFound.dispatch(device);
	}

	private raiseOnDeviceLost(device: Mobile.IDevice) {
		this.deviceLost.dispatch(device);
	}
}
$injector.register("deviceDiscovery", DeviceDiscovery);

export class IOSDeviceDiscovery extends DeviceDiscovery {

	private static ADNCI_MSG_CONNECTED: number = 1;
	private static ADNCI_MSG_DISCONNECTED: number = 2;

	constructor(private $coreFoundation: Mobile.ICoreFoundation,
		private $mobileDevice: Mobile.IMobileDevice,
		private $injector: IInjector) {
		super();
	}

	public startLookingForDevices(): void {
		this.subscribeForNotifications();
		var defaultTimeoutInSeconds = options.timeout ? parseInt(options.timeout, 10)/1000 : 4;
		this.startRunLoopWithTimer(defaultTimeoutInSeconds);
	}

	private static deviceNotificationCallback(devicePointer?: NodeBuffer, user?: number) : any {
		var iOSDeviceDiscovery = $injector.resolve("iOSDeviceDiscovery");
		var deviceInfo = ref.deref(devicePointer);

		if(deviceInfo.msg === IOSDeviceDiscovery.ADNCI_MSG_CONNECTED) {
			iOSDeviceDiscovery.createAndAddDevice(deviceInfo.dev);
		}
		else if(deviceInfo.msg === IOSDeviceDiscovery.ADNCI_MSG_DISCONNECTED) {
			var deviceIdentifier = iOSDeviceDiscovery.$coreFoundation.convertCFStringToCString(iOSDeviceDiscovery.$mobileDevice.deviceCopyDeviceIdentifier(deviceInfo.dev));
			iOSDeviceDiscovery.removeDevice(deviceIdentifier);
		}
	}

	private static timerCallback(): void {
		var iOSDeviceDiscovery = $injector.resolve("iOSDeviceDiscovery");
		iOSDeviceDiscovery.$coreFoundation.runLoopStop(iOSDeviceDiscovery.$coreFoundation.runLoopGetCurrent());
	}

	private validateResult(result: number, error: string) {
		if(result != 0)  {
			throw new Error(error);
		}
	}

	private subscribeForNotifications() {
		var notifyFunction = ref.alloc(CoreTypes.CoreTypes.amDeviceNotificationRef);
		var notificationCallback = CoreTypes.CoreTypes.am_device_notification_callback.toPointer(IOSDeviceDiscovery.deviceNotificationCallback);

		var result = this.$mobileDevice.deviceNotificationSubscribe(notificationCallback, 0, 0, 0, notifyFunction);
		this.validateResult(result, "Unable to subscribe for notifications");
	}

	private startRunLoopWithTimer(timeout: number): void {
		var kCFRunLoopDefaultMode = this.$coreFoundation.kCFRunLoopDefaultMode();
		var timer: NodeBuffer = null;

		if(timeout > 0) {
			timer = this.$coreFoundation.runLoopTimerCreate(null, this.$coreFoundation.absoluteTimeGetCurrent() + timeout, 0, 0, 0, CoreTypes.CoreTypes.cf_run_loop_timer_callback.toPointer(IOSDeviceDiscovery.timerCallback), null);
			this.$coreFoundation.runLoopAddTimer(this.$coreFoundation.runLoopGetCurrent(), timer, kCFRunLoopDefaultMode);
		}

		this.$coreFoundation.runLoopRun();

		if(timeout > 0) {
			this.$coreFoundation.runLoopRemoveTimer(this.$coreFoundation.runLoopGetCurrent(), timer, kCFRunLoopDefaultMode);
		}
	}

	private createAndAddDevice(devicePointer): void {
		var device = this.$injector.resolve(IOSDevice.IOSDevice, {devicePointer: devicePointer});
		this.addDevice(device);
	}
}
$injector.register("iOSDeviceDiscovery", IOSDeviceDiscovery);

export class AndroidDeviceDiscovery extends DeviceDiscovery {
	private static adb;
	private static get Adb() {
		if (!AndroidDeviceDiscovery.adb) {
			if (helpers.isWindows()) {
				AndroidDeviceDiscovery.adb = path.join(__dirname, "../../../resources/platform-tools/android/windows/adb");
			} else if (helpers.isDarwin()) {
				AndroidDeviceDiscovery.adb = path.join(__dirname, "../../../resources/platform-tools/android/osx/adb");
			}
		}
		return AndroidDeviceDiscovery.adb;
	}

	constructor(private $childProcess: IChildProcess,
		private $injector: IInjector){
		super();
	}

	private createAndAddDevice(deviceIdentifier): void {
		var device = this.$injector.resolve(AndroidDevice.AndroidDevice, { identifier: deviceIdentifier, adb: AndroidDeviceDiscovery.Adb });
		this.addDevice(device);
	}

	public startLookingForDevices(): IFuture<void> {
		return(()=> {
			this.ensureAdbServerStarted().wait();

			var requestAllDevicesCommand = util.format("%s devices", AndroidDeviceDiscovery.Adb);
			var result = this.$childProcess.exec(requestAllDevicesCommand).wait();

			var devices = result.toString().split(os.EOL).slice(1)
				.filter( (element) => {
					return element && !element.isEmpty();
				})
				.map( (element) => {
					var identifier = element.split("\t")[0];
					this.createAndAddDevice(identifier);
				});
		}).future<void>()();
	}

	private ensureAdbServerStarted(): IFuture<void> {
		var startAdbServerCommand = util.format("%s start-server", AndroidDeviceDiscovery.Adb);
		return this.$childProcess.exec(startAdbServerCommand);
	}
}
$injector.register("androidDeviceDiscovery", AndroidDeviceDiscovery);


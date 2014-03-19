///<reference path="./../../.d.ts"/>

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

class IOSDeviceDiscovery extends DeviceDiscovery {

	private static ADNCI_MSG_CONNECTED = 1;
	private static ADNCI_MSG_DISCONNECTED = 2;
	private static APPLE_SERVICE_NOT_STARTED_ERROR_CODE = 0xE8000063;

	private timerCallbackPtr = null;
	private  notificationCallbackPtr = null;

	constructor(private $coreFoundation: Mobile.ICoreFoundation,
		private $mobileDevice: Mobile.IMobileDevice,
		private $errors: IErrors,
		private $injector: IInjector) {
		super();
		this.timerCallbackPtr = CoreTypes.CoreTypes.cf_run_loop_timer_callback.toPointer(IOSDeviceDiscovery.timerCallback);
		this.notificationCallbackPtr = CoreTypes.CoreTypes.am_device_notification_callback.toPointer(IOSDeviceDiscovery.deviceNotificationCallback);
	}

	public startLookingForDevices(): void {
		this.subscribeForNotifications();
		var defaultTimeoutInSeconds = options.timeout ? parseInt(options.timeout, 10)/1000 : 1;
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
			this.$errors.fail(error);
		}
	}

	private subscribeForNotifications() {
		var notifyFunction = ref.alloc(CoreTypes.CoreTypes.amDeviceNotificationRef);

		var result = this.$mobileDevice.deviceNotificationSubscribe(this.notificationCallbackPtr, 0, 0, 0, notifyFunction);
		var error = IOSDeviceDiscovery.APPLE_SERVICE_NOT_STARTED_ERROR_CODE ?
			"Cannot run and complete operations on iOS devices because Apple Mobile Device Service is not started. Verify that iTunes is installed and running on your system." : "Unable to subscribe for notifications";
		this.validateResult(result, error);
		this.$errors.verifyHeap("subscribeForNotifications");
	}

	private startRunLoopWithTimer(timeout: number): void {
		var kCFRunLoopDefaultMode = this.$coreFoundation.kCFRunLoopDefaultMode();
		var timer: NodeBuffer = null;

		if(timeout > 0) {
			var currentTime = this.$coreFoundation.absoluteTimeGetCurrent() + timeout;
			timer = this.$coreFoundation.runLoopTimerCreate(null, currentTime , 0, 0, 0, this.timerCallbackPtr, null);
			this.$coreFoundation.runLoopAddTimer(this.$coreFoundation.runLoopGetCurrent(), timer, kCFRunLoopDefaultMode);
		}

		this.$coreFoundation.runLoopRun();

		if(timeout > 0) {
			this.$coreFoundation.runLoopRemoveTimer(this.$coreFoundation.runLoopGetCurrent(), timer, kCFRunLoopDefaultMode);
		}

		this.$errors.verifyHeap("startRunLoopWithTimer");
	}

	private createAndAddDevice(devicePointer): void {
		var device = this.$injector.resolve(IOSDevice.IOSDevice, {devicePointer: devicePointer});
		this.addDevice(device);
	}
}

class IOSDeviceDiscoveryStub extends DeviceDiscovery {
	constructor(private $logger: ILogger,
		private error: string) {
		super();
	}

	public startLookingForDevices(): void {
		this.$logger.warn(this.error);
	}
}

class ITunesValidator {
	private static NOT_INSTALLED_iTUNES_ERROR_MESSAGE = "iTunes is not installed. Install it on your system and run this command again.";

	constructor(private $fs: IFileSystem) { }

	public getError(): IFuture<string> {
		return (() => {
			if(helpers.isWindows64()) {
				if(process.arch === "x64") {
					return "To be able to run operations on connected iOS devices, install the 32-bit version of Node.js.";
				}
			}

			var coreFoundationDir = "";
			var mobileDeviceDir = "";

			if(helpers.isWindows()) {
				var commonProgramFiles = helpers.isWindows64() ?  process.env["CommonProgramFiles(x86)"] : process.env.CommonProgramFiles;
				coreFoundationDir = path.join(commonProgramFiles, "Apple", "Apple Application Support");
				mobileDeviceDir = path.join(commonProgramFiles, "Apple", "Mobile Device Support");
			} else if(helpers.isDarwin()) {
				coreFoundationDir = "/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation";
				mobileDeviceDir = "/System/Library/PrivateFrameworks/MobileDevice.framework/MobileDevice";
			}

			var existsCoreFoundation = this.$fs.exists(coreFoundationDir).wait();
			var existsMobileDevice = this.$fs.exists(mobileDeviceDir).wait();

			if(!existsCoreFoundation || !existsMobileDevice) {
				return ITunesValidator.NOT_INSTALLED_iTUNES_ERROR_MESSAGE;
			}

			return null;

		}).future<string>()();
	}
}

$injector.register("iOSDeviceDiscovery", ($errors: IErrors, $logger: ILogger, $fs: IFileSystem, $injector: IInjector) => {
	var iTunesValidator = new ITunesValidator($fs);
	var error = iTunesValidator.getError().wait();
	var result: Mobile.IDeviceDiscovery = null;

	if(error) {
		result = new IOSDeviceDiscoveryStub($logger, error);
	} else {
		result = $injector.resolve(IOSDeviceDiscovery);
	}

	return result;
});

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

	private createAndAddDevice(deviceIdentifier): IFuture<void> {
		return (() => {
			var device = this.$injector.resolve(AndroidDevice.AndroidDevice, {
					identifier: deviceIdentifier, adb: AndroidDeviceDiscovery.Adb
				});
			this.addDevice(device);
		}).future<void>()();
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
				.map((element) => {
					// http://developer.android.com/tools/help/adb.html#devicestatus
					var parts = element.split("\t");
					var identifier = parts[0];
					var state = parts[1];
					if (state === "device"/*ready*/) {
						this.createAndAddDevice(identifier).wait();
					}
				});
		}).future<void>()();
	}

	private ensureAdbServerStarted(): IFuture<void> {
		var startAdbServerCommand = util.format("%s start-server", AndroidDeviceDiscovery.Adb);
		return this.$childProcess.exec(startAdbServerCommand);
	}
}
$injector.register("androidDeviceDiscovery", AndroidDeviceDiscovery);


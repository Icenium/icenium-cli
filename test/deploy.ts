import yok = require("../lib/common/yok");
import {DevicesService} from "../lib/common/mobile/mobile-core/devices-service";
import {Logger} from "../lib/common/logger";
import {FileSystem} from "../lib/common/file-system";
import {Errors} from "../lib/common/errors";
import {MobileHelper} from "../lib/common/mobile/mobile-helper";
import {Options} from "../lib/options";
import {DeployHelper} from "../lib/commands/deploy";
import {DeviceDiscovery} from "../lib/common/mobile/mobile-core/device-discovery";
import {StaticConfig} from "../lib/config";
import {Messages} from "../lib/common/messages/messages";
import {MessagesService} from "../lib/common/services/messages-service";
import {MobilePlatformsCapabilities} from "../lib/common/appbuilder/mobile-platforms-capabilities";
import {DevicePlatformsConstants} from "../lib/common/mobile/device-platforms-constants";
import * as constants from "../lib/common/constants";
import Future = require("fibers/future");
import chai = require("chai");
let assert: chai.Assert = chai.assert;

class IOSDeviceDiscoveryMock extends DeviceDiscovery { }

class IOSSimulatorDiscoveryMock extends DeviceDiscovery { }

class AndroidDeviceDiscoveryMock extends DeviceDiscovery { }

let isAndroidEmulatorStarted: boolean, isiOSSimulatorStarted: boolean;

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();
	testInjector.register("devicesService", DevicesService);
	testInjector.register("logger", Logger);
	testInjector.register("config", {});
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("messages", Messages);
	testInjector.register("messagesService", MessagesService);
	testInjector.register("fs", FileSystem);
	testInjector.register("project", {
		ensureProject: () => { /* */ },
		capabilities: {
			deploy: true
		},
		projectData: {
			AppIdentifier: "com.telerik.myApp",
			Framework: "Cordova"
		}
	});
	testInjector.register("buildService", {
		buildForiOSSimulator: () => Future.fromResult(""),
		buildForDeploy: () => Future.fromResult("")
	});
	testInjector.register("liveSyncService", {
		livesync: () => Future.fromResult()
	});

	testInjector.register("errors", Errors);
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("options", Options);

	testInjector.register("androidEmulatorServices", {
		startEmulator: () => {
			return (() => {
				isAndroidEmulatorStarted = true;
				//emitConnectedAndroidDevice(testInjector);
			}).future<void>()();
		}
	});
	testInjector.register("iOSEmulatorServices", {
		startEmulator: () => {
			return (() => {
				isiOSSimulatorStarted = true;
				emitRunningiOSSimulator(testInjector);
			}).future<void>()();
		}
	});
	testInjector.register("wp8EmulatorServices", {
		startEmulator: () => Future.fromResult()
	});

	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("deviceLogProvider", {});

	testInjector.register("deployHelper", DeployHelper);
	testInjector.register("deviceDiscovery", DeviceDiscovery);

	testInjector.register("iOSDeviceDiscovery", IOSDeviceDiscoveryMock);
	testInjector.register("iOSSimulatorDiscovery", IOSSimulatorDiscoveryMock);
	testInjector.register("androidDeviceDiscovery", AndroidDeviceDiscoveryMock);
	testInjector.register("androidProcessService", {});
	return testInjector;
}

function setExecutedOnDeviceFlag(device: any): IFuture<void> {
	return (() => {
		(<any>device).isExecutedOnDevice = true;
	}).future<void>()();
}

function iOSDeviceInfo(): Mobile.IDeviceInfo {
	return {
		identifier: "fbece8e562ac63749a1018a9f1ea57614c5c953a",
		displayName: "iPhone7,1",
		model: "model",
		version: "version",
		vendor: "Apple",
		platform: "iOS",
		status: "status",
		errorHelp: "errorHelp",
		isTablet: false,
		type: "Device"
	};
}

function emitConnectediOSDevice(testInjector: IInjector) {
	let device = {};
	let deviceInfo = iOSDeviceInfo();
	let applicationManager = {
		reinstallApplication: (applicationId: string, packageFilePath: string) => {
			return setExecutedOnDeviceFlag(device);
		},
		canStartApplication: () => {
			return false;
		}
	};

	device = {
		deviceInfo: deviceInfo,
		applicationManager: applicationManager,
		fileSystem: { },
		isEmulator: false
	};

	let iOSDeviceDiscovery = testInjector.resolve("iOSDeviceDiscovery");
	iOSDeviceDiscovery.addDevice(device);
}

function iOSSimulatorInfo(): Mobile.IDeviceInfo {
	return {
		identifier: "5AA4EA86-670C-4E07-8FA0-5CFF6BC30E45",
		displayName: "iPhone 6",
		model: "model",
		version: "version",
		vendor: "Apple",
		platform: "iOS",
		status: "status",
		errorHelp: "errorHelp",
		isTablet: false,
		type: "Emulator"
	};
}

function emitRunningiOSSimulator(testInjector: IInjector) {
	let device = {};
	let deviceInfo = iOSSimulatorInfo();
	let applicationManager = {
		reinstallApplication: (applicationId: string, packageFilePath: string) => {
			return setExecutedOnDeviceFlag(device);
		},
		canStartApplication: () => {
			return false;
		}
	};

	device = {
		deviceInfo: deviceInfo,
		applicationManager: applicationManager,
		fileSystem: { },
		isEmulator: true
	};

	let iOSSimulatorDiscovery = testInjector.resolve("iOSSimulatorDiscovery");
	iOSSimulatorDiscovery.addDevice(device);
}

function removeiOSDevice(testInjector: IInjector, deviceIdentifier: string) {
	let iOSDeviceDiscovery = testInjector.resolve("iOSDeviceDiscovery");
	iOSDeviceDiscovery.removeDevice(deviceIdentifier);
}

function removeiOSSimulator(testInjector: IInjector, deviceIdentifier: string) {
	let iOSSimulatorDiscovery = testInjector.resolve("iOSSimulatorDiscovery");
	iOSSimulatorDiscovery.removeDevice(deviceIdentifier);
}

function setEmulatorOption(testInjector: IInjector) {
	let options = testInjector.resolve("options");
	options.emulator = true;
}

function unsetEmulatorOption(testInjector: IInjector) {
	let options = testInjector.resolve("options");
	options.emulator = false;
}

let isErrorThrown = false;
function prepareTestInjectorForWindows(): IInjector {
	let testInjector = createTestInjector();

	let mobileHelper = testInjector.resolve("mobileHelper");
	mobileHelper.isPlatformSupported = (platform: string) => true;

	let fs = testInjector.resolve("fs");
	fs.getFileSize = (packageFilePath: string) => Future.fromResult("123");

	testInjector.register("hostInfo", {
		isWindows: true
	});
	process.env.LocalAppData = "";
	let errors = testInjector.resolve("errors");
	errors.failWithoutHelp = (err: any) => {
		isErrorThrown = true;
		throw new Error(err);
	};

	return testInjector;
}

function prepareTestInjectorForDarwin(): IInjector {
	let testInjector = createTestInjector();

	let mobileHelper = testInjector.resolve("mobileHelper");
	mobileHelper.isPlatformSupported = (platform: string) => true;

	let fs = testInjector.resolve("fs");
	fs.getFileSize = (packageFilePath: string) => Future.fromResult("123");

	testInjector.register("hostInfo", {
		isDarwin: true
	});

	return testInjector;
}

describe("Deploy ios unit tests on windows", () => {
	it("throws ERROR_NO_DEVICES when there is no connected devices", () => {
		let testInjector = prepareTestInjectorForWindows();
		let deployHelper = testInjector.resolve("deployHelper");

		assert.throws(() => deployHelper.deploy("ios").wait(), constants.ERROR_NO_DEVICES);
	});
	it("throws error when --emulator option is specified", () => { // appbuilder deploy ios --emulator
		let testInjector = prepareTestInjectorForWindows();
		let deployHelper = testInjector.resolve("deployHelper");

		setEmulatorOption(testInjector);
		assert.throws(() => deployHelper.deploy("ios").wait(), "You can use iOS simulator only on OS X.");

		unsetEmulatorOption(testInjector);
	});
	it("deploys on connected device when there is connected device and --emulator option is not specified", () => {
		let testInjector = prepareTestInjectorForWindows();
		let deployHelper = testInjector.resolve("deployHelper");
		emitConnectediOSDevice(testInjector);
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let iOSDevice = _.find(devices, d => !d.isEmulator);

		assert.equal(1, devices.length);
		assert.isTrue((<any>iOSDevice).isExecutedOnDevice);
		assert.deepEqual(iOSDeviceInfo(), iOSDevice.deviceInfo);

		removeiOSDevice(testInjector, iOSDevice.deviceInfo.identifier);
	});
});

describe("Deploy ios unit tests on OSX", () => {
	it("starts the iOS simulator when there is only connected iOS device and --emulator option is specified", () => {
		let testInjector = prepareTestInjectorForDarwin();
		let deployHelper = testInjector.resolve("deployHelper");
		emitConnectediOSDevice(testInjector);
		setEmulatorOption(testInjector);
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let iOSDevice = _.find(devices, d => !d.isEmulator);
		let simulator = _.find(devices, d => d.isEmulator);

		assert.equal(2, devices.length);
		assert.isFalse(!!(<any>iOSDevice).isExecutedOnDevice);
		assert.isTrue((<any>simulator).isExecutedOnDevice);
		assert.deepEqual(iOSDeviceInfo(), iOSDevice.deviceInfo);
		assert.isTrue(isiOSSimulatorStarted);

		removeiOSDevice(testInjector, iOSDevice.deviceInfo.identifier);
		removeiOSSimulator(testInjector, simulator.deviceInfo.identifier);
		unsetEmulatorOption(testInjector);
		isiOSSimulatorStarted = false;
	});
	it("starts the iOS simulator whene there is no running simulator and no connected iOS device", () => {
		let testInjector = prepareTestInjectorForDarwin();
		let deployHelper = testInjector.resolve("deployHelper");
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let simulator = _.find(devices, d => d.isEmulator);

		assert.equal(1, devices.length);
		assert.isTrue((<any>simulator).isExecutedOnDevice);
		assert.isTrue(isiOSSimulatorStarted);

		removeiOSSimulator(testInjector, simulator.deviceInfo.identifier);
		isiOSSimulatorStarted = false;
	});
	it("deploys only on iOS simulator when there is running simulator and connected iOS device and --emulator option is specified", () => {
		let testInjector = prepareTestInjectorForDarwin();
		let deployHelper = testInjector.resolve("deployHelper");
		emitRunningiOSSimulator(testInjector);
		emitConnectediOSDevice(testInjector);
		setEmulatorOption(testInjector);
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let simulator = _.find(devices, d => d.isEmulator);
		let iOSDevice = _.find(devices, d => !d.isEmulator);

		assert.equal(2, devices.length);
		assert.isTrue((<any>simulator).isExecutedOnDevice);
		assert.isFalse(!!(<any>iOSDevice).isExecutedOnDevice);
		assert.deepEqual(iOSSimulatorInfo(), simulator.deviceInfo);

		removeiOSSimulator(testInjector, simulator.deviceInfo.identifier);
		removeiOSDevice(testInjector, iOSDevice.deviceInfo.identifier);
		unsetEmulatorOption(testInjector);
	});
	it("deploys on iOS simulator when there is only running simulator and --emulator option is specified", () => {
		let testInjector = prepareTestInjectorForDarwin();
		let deployHelper = testInjector.resolve("deployHelper");
		emitRunningiOSSimulator(testInjector);
		setEmulatorOption(testInjector);
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let simulator = _.find(devices, d => d.isEmulator);

		assert.equal(1, devices.length);
		assert.isTrue((<any>simulator).isExecutedOnDevice);
		assert.deepEqual(iOSSimulatorInfo(), simulator.deviceInfo);

		removeiOSSimulator(testInjector, simulator.deviceInfo.identifier);
		unsetEmulatorOption(testInjector);
	});
	it("deploys on iOS simulator when there is only running simulator and --emulator option is not specified", () => {
		let testInjector = prepareTestInjectorForDarwin();
		let deployHelper = testInjector.resolve("deployHelper");
		emitRunningiOSSimulator(testInjector);
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let simulator = _.find(devices, d => d.isEmulator);

		assert.equal(1, devices.length);
		assert.isTrue((<any>simulator).isExecutedOnDevice);
		assert.deepEqual(iOSSimulatorInfo(), simulator.deviceInfo);

		removeiOSSimulator(testInjector, simulator.deviceInfo.identifier);
	});
	it("deploys on iOS device when there is running simulator and connected iOS device and --emulator option is not specified", () => {
		let testInjector = prepareTestInjectorForDarwin();
		let deployHelper = testInjector.resolve("deployHelper");
		emitRunningiOSSimulator(testInjector);
		emitConnectediOSDevice(testInjector);
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let simulator = _.find(devices, d => d.isEmulator);
		let iOSDevice = _.find(devices, d => !d.isEmulator);

		assert.equal(2, devices.length);
		assert.isTrue((<any>iOSDevice).isExecutedOnDevice);
		assert.isFalse(!!(<any>simulator).isExecutedOnDevice);
		assert.deepEqual(iOSDeviceInfo(), iOSDevice.deviceInfo);

		removeiOSSimulator(testInjector, simulator.deviceInfo.identifier);
		removeiOSDevice(testInjector, iOSDevice.deviceInfo.identifier);
	});
	it("deploys on iOS device when there is only connected iOS device and --emulator option is not specified", () => {
		let testInjector = prepareTestInjectorForDarwin();
		let deployHelper = testInjector.resolve("deployHelper");
		emitConnectediOSDevice(testInjector);
		deployHelper.deploy("ios").wait();

		let devicesService: Mobile.IDevicesService = testInjector.resolve("devicesService");
		let devices = devicesService.getDeviceInstances();
		let iOSDevice = _.find(devices, d => !d.isEmulator);

		assert.equal(1, devices.length);
		assert.isTrue((<any>iOSDevice).isExecutedOnDevice);
		assert.deepEqual(iOSDeviceInfo(), iOSDevice.deviceInfo);

		removeiOSDevice(testInjector, iOSDevice.deviceInfo.identifier);
	});
});

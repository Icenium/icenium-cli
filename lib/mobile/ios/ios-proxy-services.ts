///<reference path="../../.d.ts"/>

import ref = require("ref");
import ffi = require("ffi");
import os = require("os");
import path = require("path");
import iOSCore = require("./ios-core");
import Future = require("fibers/future");
import util = require("util");
import helpers = require("./../../helpers");
import net = require("net");
import MobileHelpers = require("./../mobile-helper");

class MobileServices {
	public static APPLE_FILE_CONNECTION: string = "com.apple.afc";
	public static INSTALLATION_PROXY: string = "com.apple.mobile.installation_proxy";
	public static HOUSE_ARREST: string = "com.apple.mobile.house_arrest";
	public static NOTIFICATION_PROXY: string = "com.apple.mobile.notification_proxy";
	public static SYSLOG: string = "com.apple.syslog_relay";
}

export class AfcFile {
	private open: boolean = false;
	private afcFile;

	constructor(path: string,
		mode: string,
		private afcConnection: NodeBuffer,
		private $mobileDevice: Mobile.IMobileDevice,
		private $errors: IErrors) {
		var modeValue = 0;
		if (mode.indexOf("r") > -1) {
			modeValue = 0x1;
		}
		if (mode.indexOf("w") > -1) {
			modeValue = 0x2;
		}
		var afcFileRef = ref.alloc(ref.types.uint64);
		this.open = false;

		var result = this.$mobileDevice.afcFileRefOpen(afcConnection, path, modeValue, afcFileRef);
		if (result !== 0) {
			this.$errors.fail("Unable to open file reference: '%s' with path '%s", result, path);
		}

		this.afcFile = ref.deref(afcFileRef);
		if (this.afcFile === 0) {
			this.$errors.fail("Invalid file reference");
		}

		this.open = true;
	}

	write(buffer: any, byteLength?: any): boolean {
		var result = this.$mobileDevice.afcFileRefWrite(this.afcConnection, this.afcFile, buffer, byteLength);
		if (result !== 0) {
			this.$errors.fail("Unable to write to file: '%s'. Result is: '%s'", this.afcFile, result);
		}

		return true;
	}

	close() {
		if (this.open) {
			var result = this.$mobileDevice.afcFileRefClose(this.afcConnection, this.afcFile);
			if (result !== 0) {
				this.$errors.fail("Unable to close afc file connection: '%s'. Result is: '%s'", this.afcFile, result);
			}
			this.open = false;
		}
	}

	get writable(): boolean {
		return true;
	}
}

export class AfcClient implements Mobile.IAfcClient {
	private afcConnection = null;

	constructor(private service: number,
		private $mobileDevice: Mobile.IMobileDevice,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $injector: IInjector) {
		var afcConnection = ref.alloc(ref.refType(ref.types.void));
		var result = $mobileDevice.afcConnectionOpen(this.service, 0, afcConnection);
		if (result !== 0) {
			$errors.fail("Unable to open apple file connection: %s", result);
		}

		this.afcConnection = ref.deref(afcConnection);
	}

	open(path: string, mode: string) {
		return this.$injector.resolve(AfcFile, {path: path, mode: mode, afcConnection: this.afcConnection});
	}

	mkdir(path: string) {
		var result = this.$mobileDevice.afcDirectoryCreate(this.afcConnection, path);
		if (result !== 0) {
			this.$errors.fail("Unable to make directory: %s. Result is %s", path, result);
		}
	}

	listDir(path: string) {
		var afcDirectoryRef = ref.alloc(ref.refType(ref.types.void));
		var result = this.$mobileDevice.afcDirectoryOpen(this.afcConnection, path, afcDirectoryRef);
		if (result !== 0) {
			this.$errors.fail("Unable to open AFC directory: '%s' %s ", path, result);
		}

		var afcDirectoryValue = ref.deref(afcDirectoryRef);
		var name = ref.alloc(ref.refType(ref.types.char));

		while (this.$mobileDevice.afcDirectoryRead(this.afcConnection, afcDirectoryValue, name) === 0) {
			var value = ref.deref(name);
			if (ref.address(value) === 0) {
				break;
			}
			var filePath = ref.readCString(value, 0);
			if (filePath !== "." && filePath !== "..") {
				console.log(filePath);
			}
		}

		this.$mobileDevice.afcDirectoryClose(this.afcConnection, afcDirectoryValue);
	}

	public transferPackage(localFilePath: string, devicePath: string): IFuture<void> {
		return (() => {
			this.transfer(localFilePath, devicePath).wait();
		}).future<void>()();
	}

	public transferCollection(localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			localToDevicePaths.forEach((localToDevicePathData) => {
				this.transfer(localToDevicePathData.getLocalPath(),  path.join("/Documents", localToDevicePathData.getRelativeToProjectBasePath())).wait();
			});
		}).future<void>()();
	}

	public deleteFile(devicePath: string): void {
		var removeResult = this.$mobileDevice.afcRemovePath(this.afcConnection, devicePath);
		this.$logger.trace("Removing device file '%s', result: %s", devicePath, removeResult);
	}

	private transfer(localFilePath: string, devicePath: string): IFuture<void> {
		return(() => {
			this.ensureDevicePathExist(path.dirname(devicePath));
			var reader = this.$fs.createReadStream(localFilePath);
			devicePath = helpers.fromWindowsRelativePathToUnix(devicePath);

			this.deleteFile(devicePath);

			var target = this.open(devicePath, "w");
			var localFilePathSize = this.$fs.getFileSize(localFilePath).wait();

			reader.on("data", (data) => {
				target.write(data, data.length);
				this.$logger.trace("transfer-> localFilePath: '%s', devicePath: '%s', localFilePathSize: '%s', transferred bytes: '%s'", localFilePath, devicePath, localFilePathSize, data.length);
			})
			.on("error", (error) => {
				this.$errors.fail(error);
			})
			.on("end", function () {
				target.close();
			});

			this.$fs.futureFromEvent(reader, "close").wait();

		}).future<void>()();
	}

	private ensureDevicePathExist(deviceDirPath: string): void {
		var filePathParts = deviceDirPath.split(path.sep);
		var currentDevicePath = "";

		filePathParts.forEach((filePathPart: string) => {
			if (filePathPart !== "") {
				currentDevicePath = helpers.fromWindowsRelativePathToUnix(path.join(currentDevicePath, filePathPart));
				this.mkdir(currentDevicePath);
			}
		});
	}
}

export class InstallationProxyClient {
	private plistService: Mobile.IiOSDeviceSocket = null;

	constructor(private device: Mobile.IIOSDevice,
		private $logger: ILogger,
		private $injector: IInjector) { }

	public deployApplication(packageFile: string) : IFuture<void>  {
		return(() => {
			var service = this.device.startService(MobileServices.APPLE_FILE_CONNECTION);
			var afcClient = this.$injector.resolve(AfcClient, {service: service});
			var devicePath = path.join("PublicStaging", path.basename(packageFile));

			afcClient.transferPackage(packageFile, devicePath).wait();
			this.plistService = this.$injector.resolve(iOSCore.PlistService, {service: this.device.startService(MobileServices.INSTALLATION_PROXY), format: iOSCore.CoreTypes.kCFPropertyListBinaryFormat_v1_0});

			this.plistService.sendMessage({
				Command: "Install",
				"PackagePath": helpers.fromWindowsRelativePathToUnix(devicePath)
			});
			this.plistService.receiveMessage().wait();
			this.$logger.info("Successfully deployed on device %s", this.device.getIdentifier());
		}).future<void>()();
	}

	public closeSocket() {
		return this.plistService.close();
	}
}
$injector.register("installationProxyClient", InstallationProxyClient);

export class NotificationProxyClient {
	private plistService: Mobile.IiOSDeviceSocket = null;

	constructor(private device: Mobile.IIOSDevice,
		private $injector: IInjector) { }

	postNotification(notificationName: string) {
		this.plistService = this.$injector.resolve(iOSCore.PlistService, {service:  this.device.startService(MobileServices.NOTIFICATION_PROXY), format: iOSCore.CoreTypes.kCFPropertyListBinaryFormat_v1_0});

		var result = this.plistService.sendMessage({
			"Command": "PostNotification",
			"Name": notificationName,
			"ClientOptions": ""
		});

		return result;
	}

	public closeSocket() {
		this.plistService.close();
	}
}

export class HouseArrestClient implements Mobile.IHouseArrestClient {
	private plistService: Mobile.IiOSDeviceSocket = null;

	constructor(private device: Mobile.IIOSDevice,
		private $injector: IInjector) {
	}

	private getAfcClientCore(command, applicationIdentifier: string): Mobile.IAfcClient {
		var service = this.device.startService(MobileServices.HOUSE_ARREST);
		this.plistService = this.$injector.resolve(iOSCore.PlistService, {service: service, format: iOSCore.CoreTypes.kCFPropertyListXMLFormat_v1_0});

		this.plistService.sendMessage({
			"Command": command,
			"Identifier": applicationIdentifier
		});

		this.plistService.receiveMessage().wait();

		return this.$injector.resolve(AfcClient, {service: service});
	}

	public getAfcClientForAppDocuments(applicationIdentifier: string): Mobile.IAfcClient {
		return this.getAfcClientCore("VendDocuments", applicationIdentifier);
	}

	public getAfcClientForAppContainer(applicationIdentifier: string): Mobile.IAfcClient {
		return this.getAfcClientCore("VendContainer", applicationIdentifier);
	}

	public closeSocket() {
		this.plistService.close();
	}
}

export class IOSSyslog {
	private plistService;
	private matchRegex = new RegExp(".*?((Cordova.{3}|AppBuilder)\\[\\d+\\] <Warning>: )", 'i');

	constructor(private device: Mobile.IIOSDevice,
		private $logger: ILogger,
		private $injector: IInjector) {
		this.plistService = this.$injector.resolve(iOSCore.PlistService, {service: this.device.startService(MobileServices.SYSLOG), format: undefined});
	}

	public read(): void {
		var printData = (data: NodeBuffer) => {
			var output = ref.readCString(data, 0);
			if(this.matchRegex.test(output)) {
				this.$logger.out(output);
			}
		};

		this.plistService.readSystemLog(printData);
	}
}
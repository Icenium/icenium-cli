///<reference path="../../.d.ts"/>

import ref = require("ref");
import ffi = require("ffi");
import os = require("os");
import path = require("path");
import iOSCore = require("./ios-core");
import Future = require("fibers/future");
import util = require("util");
import _ = require("underscore");
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

	constructor(private afcConnection: NodeBuffer,
				path: string,
				mode: string,
				private mobileDevice: Mobile.IMobileDevice) {
		var modeValue = 0;
		if (mode.indexOf("r") > -1) {
			modeValue = 0x1;
		}
		if (mode.indexOf("w") > -1) {
			modeValue = 0x2;
		}
		var afcFileRef = ref.alloc(ref.types.uint64);
		this.open = false;

		var result = mobileDevice.afcFileRefOpen(this.afcConnection, path, modeValue, 0, afcFileRef);
		if (result !== 0) {
			throw "Unable to open file reference: " + result + "path is: " + path;
		}

		this.afcFile = ref.deref(afcFileRef);
		if (this.afcFile === 0) {
			throw "Invalid file: " + 0;
		}

		this.open = true;
	}

	write(buffer: any, byteLength?: any): boolean {
		var result = this.mobileDevice.afcFileRefWrite(this.afcConnection, this.afcFile, buffer, byteLength);
		if (result !== 0) {
			throw "Unable to write to file: " + result;
		}

		return true;
	}

	close() {
		if (this.open) {
			var result = this.mobileDevice.afcFileRefClose(this.afcConnection, this.afcFile);
			if (result !== 0) {
				throw "Unable to close afc file connection: " + result;
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
		private mobileDevice: Mobile.IMobileDevice,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger) {
		var afcConnection = ref.alloc(ref.refType(ref.types.void));
		var result = mobileDevice.afcConnectionOpen(this.service, 0, afcConnection);
		if (result !== 0) {
			$errors.fail("Unable to open apple file connection: %s", result);
		}

		this.afcConnection = ref.deref(afcConnection);
	}

	open(path: string, mode: string) {
		return new AfcFile(this.afcConnection, path, mode, this.mobileDevice);
	}

	mkdir(path: string) {
		var result = this.mobileDevice.afcDirectoryCreate(this.afcConnection, path);
		if (result !== 0) {
			this.$errors.fail("Unable to make directory: %s. Result is %s", path, result);
		}
	}

	listDir(path: string) {
		var afcDirectoryRef = ref.alloc(ref.refType(ref.types.void));
		var result = this.mobileDevice.afcDirectoryOpen(this.afcConnection, path, afcDirectoryRef);
		if (result !== 0) {
			this.$errors.fail("Unable to open AFC directory: '%s' %s ", path, result);
		}

		var afcDirectoryValue = ref.deref(afcDirectoryRef);
		var name = ref.alloc(ref.refType(ref.types.char));

		while (this.mobileDevice.afcDirectoryRead(this.afcConnection, afcDirectoryValue, name) === 0) {
			var value = ref.deref(name);
			if (ref.address(value) === 0) {
				break;
			}
			var filePath = ref.readCString(value, 0);
			if (filePath !== "." && filePath !== "..") {
				console.log(filePath);
			}
		}

		this.mobileDevice.afcDirectoryClose(this.afcConnection, afcDirectoryValue);
	}

	public transferPackage(localFilePath: string, devicePath: string): IFuture<void> {
		return (() => {
			if (helpers.isWindows()) {
				this.transfer(localFilePath, devicePath).wait();
			}
		}).future<void>()();
	}

	public transferCollection(localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			localToDevicePaths.forEach((localToDevicePathData) => {
				this.transferFile(localToDevicePathData.getLocalPath(), localToDevicePathData.getDevicePath(), localToDevicePathData.getRelativeToProjectBasePath()).wait();
			});
		}).future<void>()();
	}

	private transferFile(localFilePath: string, devicePath: string, relativeToProjectBasePath: any): IFuture<void> {
		return (() => {
			if (helpers.isWindows()) {
				var relativeToProjectBasePaths = relativeToProjectBasePath.split(path.sep);
				var fileName = relativeToProjectBasePaths[relativeToProjectBasePaths.length - 1];
				var targetDirectoryPath = "/Documents";

				relativeToProjectBasePaths.forEach((relativeToProjectBasePath: string) => {
					if (relativeToProjectBasePath !== "" && relativeToProjectBasePath !== fileName) {
						targetDirectoryPath = helpers.fromWindowsRelativePathToUnix(path.join(targetDirectoryPath, "/", relativeToProjectBasePath));
						this.mkdir(targetDirectoryPath);
					}
				});

				var targetPath = helpers.fromWindowsRelativePathToUnix(path.join(targetDirectoryPath, "/", fileName));
				this.transfer(localFilePath, targetPath).wait();
			}
		}).future<void>()();
	}

	private transfer(localFilePath: string, devicePath: string): IFuture<void> {
		return(() => {
			var reader = this.$fs.createReadStream(localFilePath);
			var target = this.open(devicePath, "w");
			var localFilePathSize =  this.$fs.getFileSize(localFilePath).wait();

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
}

export class InstallationProxyClient {
	constructor(private device: Mobile.IIOSDevice,
		private $coreFoundation: Mobile.ICoreFoundation,
		private $mobileDevice: Mobile.IMobileDevice,
		private $errors: IErrors,
		private $injector: IInjector) {
	}

	private static transferCallback() {

	}

	private static installCallback() {

	}

	public deployApplication(packageFile: string) {

		if(helpers.isWindows()) {
			var service = this.device.startService(MobileServices.APPLE_FILE_CONNECTION);
			var afcClient = this.$injector.resolve(AfcClient, {service: service});
			var devicePath = helpers.fromWindowsRelativePathToUnix(path.join("PublicStaging", path.basename(packageFile)));

			afcClient.transferPackage(packageFile, devicePath).wait();
			var plistService = this.$injector.resolve(iOSCore.PlistService, {service: this.device.startService(MobileServices.INSTALLATION_PROXY)});

			var plist = {
				type: "dict",
				value: {
					"Command": {
						type: "string",
						value: "Install"
					},
					"PackagePath": {
						type: "string",
						value: devicePath
					},
					"ClientOptions": {
						type: "dict",
						value: {}
					}
				}
			};

			plistService.sendMessage(plist);
			var reply = plistService.receiveMessage();

			while (reply.indexOf("PercentComplete") > 0) {
				reply = plistService.receiveMessage();
			}

			console.log("Successfully deployed on device %s", this.device.getIdentifier());

		} else if(helpers.isDarwin()) {
			var keys = ref.alloc(ref.refType(ref.types.void), this.$coreFoundation.createCFString("PackageType"));
			var values = ref.alloc(ref.refType(ref.types.void), this.$coreFoundation.createCFString("Developer"));
			var options = this.$coreFoundation.dictionaryCreate(null, keys, values, 1, this.$coreFoundation.kCFTypeDictionaryKeyCallBacks(), this.$coreFoundation.kCFTypeDictionaryValueCallBacks());

			var am_device_install_application_callback = ffi.Function("void", [ref.refType(ref.types.void), ref.refType(ref.types.void)]);

			var afcService = this.device.startService(MobileServices.APPLE_FILE_CONNECTION);
			var normalizedPath = path.normalize(packageFile);
			var resolvedPath = path.resolve(normalizedPath);

			var result = this.$mobileDevice.deviceTransferApplication(afcService, this.$coreFoundation.createCFString(resolvedPath), null, am_device_install_application_callback.toPointer(InstallationProxyClient.transferCallback));
			if(result !== 0) {
				this.$errors.fail("Unable to transfer application: %s ", result);
			}

			var installationProxyService = this.device.startService(MobileServices.INSTALLATION_PROXY);
			result = this.$mobileDevice.deviceInstallApplication(installationProxyService, this.$coreFoundation.createCFString(packageFile), options, am_device_install_application_callback.toPointer(InstallationProxyClient.installCallback));
			if (result !== 0) {
				this.$errors.fail("Unable to install application: %s", result);
			}
		}
	}
}
$injector.register("installationProxyClient", InstallationProxyClient);

export class NotificationProxyClient {
	constructor(private device: Mobile.IIOSDevice,
		private $errors: IErrors,
		private $injector: IInjector) {
	}

	postNotification(notificationName: string) {
		var service = this.device.startService(MobileServices.NOTIFICATION_PROXY);
		var plistService = this.$injector.resolve(iOSCore.PlistService, {service: service});

		var result = plistService.sendMessage({
			type: "dict",
			value: {
				"Command": {
					type: "string",
					value: "PostNotification"
				},
				"Name": {
					type: "string",
					value: notificationName
				}
			}
		});

		return result;
	}
}

export class HouseArrestClient implements Mobile.IHouseArressClient {
	constructor(private device: Mobile.IIOSDevice,
		private $errors: IErrors,
		private $injector: IInjector) {
	}

	private getAfcClientCore(device, command, applicationIdentifier: string): Mobile.IAfcClient {
		var service = this.device.startService(MobileServices.HOUSE_ARREST);
		var plistService = this.$injector.resolve(iOSCore.PlistService, {service:service});

		var plist = {
			type: "dict",
			value: {
				"Command": {
					type: "string",
					value: command
				},
				"Identifier": {
					type: "string",
					value: applicationIdentifier
				}
			}
		};

		plistService.sendMessage(plist);

		var reply = plistService.receiveMessage();

		if (reply.indexOf("Error") > 0) {
			this.$errors.fail(reply);
		}

		if (reply.indexOf("Status") < 0 || reply.indexOf("Complete") < 0) {
			this.$errors.fail("Unable to start house arrest service");
		}

		return this.$injector.resolve(AfcClient, {service: service});
	}

	public getAfcClientForAppDocuments(applicationIdentifier: string): Mobile.IAfcClient {
		return this.getAfcClientCore(this.device, "VendDocuments", applicationIdentifier);
	}

	public getAfcClientForAppContainer(applicationIdentifier: string) {
		return this.getAfcClientCore(this.device, "VendContainer", applicationIdentifier);
	}
}

export class IOSSyslog {
	private service;
	private socket;
	private matchRegex = new RegExp(".*?((Cordova.{3}|Icenium Ion)\\[\\d+\\] <Warning>: )");

	constructor(private device: Mobile.IIOSDevice,
		private $errors: IErrors,
		private $logger: ILogger,
		private $injector: IInjector) {
		this.service = device.startService(MobileServices.SYSLOG);
		if(helpers.isWindows()) {
			this.socket = this.$injector.resolve(iOSCore.WinSocketWrapper, {socket: this.service});
		} else if(helpers.isDarwin()) {
			this.socket = new net.Socket({ fd: this.service });
		}
	}

	public read(): void {
		var printData = (data: NodeBuffer) => {
			var output = ref.readCString(data, 0);
			if(this.matchRegex.test(output)) {
				this.$logger.out(output);
			}
		};

		if(helpers.isWindows()) {
			this.socket.readAll(printData);
			this.disconnect();
		} else if(helpers.isDarwin()) {
			this.socket
				.on("data", (data) => {
					printData(data);
				})
				.on("end", () => {
					this.disconnect();
				})
				.on("error", (error) => {
					this.$errors.fail(error);
				});
		}
	}

	public disconnect(): void {
		this.socket.close();
	}
}
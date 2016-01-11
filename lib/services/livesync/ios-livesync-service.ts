///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import iOSProxyServices = require("./../../common/mobile/ios/device/ios-proxy-services");
import * as path from "path";
import * as shell from "shelljs";
let osenv = require("osenv");

export class IOSLiveSyncService implements IPlatformLiveSyncService {
	constructor(private _device: Mobile.IDevice,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $iOSSimResolver: Mobile.IiOSSimResolver,
		private $logger: ILogger,
		private $project: Project.IProject) { }

	private get device(): Mobile.IDevice {
		return <Mobile.IiOSDevice>this._device;
	}

	public refreshApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			if (this.device.isEmulator) {
				let simulatorLogFilePath = path.join(osenv.home(), `/Library/Developer/CoreSimulator/Devices/${this.device.deviceInfo.identifier}/data/Library/Logs/system.log`);
				let simulatorLogFileContent = this.$fs.readText(simulatorLogFilePath).wait();

				let simulatorCachePath = path.join(osenv.home(), `/Library/Developer/CoreSimulator/Devices/${this.device.deviceInfo.identifier}/data/Containers/Data/Application/`);
				let regex = new RegExp(`^(?:.*?)${deviceAppData.appIdentifier}(?:.*?)${simulatorCachePath}(.*?)$`, "gm");

				let quid = "";
				while (true) {
					let parsed = regex.exec(simulatorLogFileContent);
					if (!parsed) {
						break;
					}
					quid = parsed[1];
				}

				let sourcePath = deviceAppData.deviceProjectRootPath;
				let destinationPath = path.join(simulatorCachePath, quid, "Documents");

				this.$logger.trace(`Transferring from ${sourcePath} to ${destinationPath}`);
				shell.cp("-Rf", path.join(sourcePath, "*"), destinationPath);

				let cfBundleExecutable = `${this.$project.projectData.Framework}${this.$project.projectData.FrameworkVersion.split(".").join("")}`; //TODO: check this for {N} project
				this.device.applicationManager.stopApplication(cfBundleExecutable).wait();
				this.device.applicationManager.startApplication(deviceAppData.appIdentifier).wait();
			} else {
				this.device.fileSystem.deleteFile("/Library/Preferences/ServerInfo.plist", deviceAppData.appIdentifier);
				let notificationProxyClient = this.$injector.resolve(iOSProxyServices.NotificationProxyClient, {device: this.device});
				notificationProxyClient.postNotification("com.telerik.app.refreshWebView");
				notificationProxyClient.closeSocket();
			}

		}).future<void>()();
	}

	public removeFiles(): IFuture<void> {
		return Future.fromResult();
	}
}
$injector.register("iosLiveSyncServiceLocator", {factory: IOSLiveSyncService});

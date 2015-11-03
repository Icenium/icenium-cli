///<reference path="../.d.ts"/>
"use strict";

import androidLiveSyncServiceLib = require("../common/mobile/android/android-livesync-service");
import constants = require("../common/mobile/constants");
import helpers = require("./../helpers");
import iOSProxyServices = require("./../common/mobile/ios/ios-proxy-services");
import usbLivesyncServiceBaseLib = require("../common/services/usb-livesync-service-base");
import liveSyncConstants = require("../livesync-constants");

import Future = require("fibers/future");
import * as util from "util";

export class LiveSyncService extends usbLivesyncServiceBaseLib.UsbLiveSyncServiceBase implements ILiveSyncService {
	private excludedProjectDirsAndFiles = [
		"app_resources",
		"plugins",
		".*.tmp",
		".ab"
	];

	constructor($devicesService: Mobile.IDevicesService,
		$logger: ILogger,
		$fs: IFileSystem,
		private $errors: IErrors,
		private $project: Project.IProject,
		private $projectFilesManager: Project.IProjectFilesManager,
		$dispatcher: IFutureDispatcher,
		$mobileHelper: Mobile.IMobileHelper,
		$options: IOptions,
		$deviceAppDataFactory: Mobile.IDeviceAppDataFactory,
		$localToDevicePathDataFactory: Mobile.ILocalToDevicePathDataFactory,
		$injector: IInjector,
		$childProcess: IChildProcess,
		$iOSEmulatorServices: Mobile.IiOSSimulatorService,
		$hostInfo: IHostInfo) {
			super($devicesService,
				$mobileHelper,
				$localToDevicePathDataFactory,
				$logger,
				$options,
				$deviceAppDataFactory,
				$fs,
				$dispatcher,
				$injector,
				$childProcess,
				$iOSEmulatorServices,
				$hostInfo);
		}

	public livesync(platform?: string): IFuture<void> {
		return (() => {
			this.$project.ensureProject();
			platform = this.initialize(platform).wait();

			if(!this.$mobileHelper.getPlatformCapabilities(platform).companion && this.$options.companion) {
				this.$errors.fail("The AppBuilder Companion app is not available on %s devices.", platform);
			}

			if(!this.$devicesService.hasDevices) {
				this.$errors.fail({ formatStr: constants.ERROR_NO_DEVICES, suppressCommandHelp: true });
			}

			if(!this.$project.capabilities.livesync && !this.$options.companion) {
				this.$errors.fail("Use $ appbuilder livesync cloud to sync your application to Telerik Nativescript Companion App. You will be able to LiveSync %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			if(!this.$project.capabilities.livesyncCompanion && this.$options.companion) {
				this.$errors.fail("You will be able to LiveSync %s based applications to the Companion app in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			let projectDir = this.$project.getProjectDir().wait();

			let notInstalledAppOnDeviceAction = (device: Mobile.IDevice): IFuture<boolean> => {
				return (() => {
					this.$errors.failWithoutHelp(`Unable to find application with identifier ${this.$project.projectData.AppIdentifier} on device ${device.deviceInfo.identifier}.`);
					return false;
				}).future<boolean>()();
			};

			let platformSpecificLiveSyncServices: IDictionary<any> = {
				"android": AndroidLiveSyncService,
				"ios": IOSLiveSyncService
			};

			this.sync(platform, this.$project.projectData.AppIdentifier, projectDir,
				this.excludedProjectDirsAndFiles, projectDir, platformSpecificLiveSyncServices, notInstalledAppOnDeviceAction,
				() => Future.fromResult()).wait();

		}).future<void>()();
	}
}
$injector.register("liveSyncService", LiveSyncService);

export class IOSLiveSyncService implements IPlatformSpecificLiveSyncService {
	constructor(private _device: Mobile.IDevice,
		private $injector: IInjector) { }

	private get device(): Mobile.IDevice {
		return <Mobile.IiOSDevice>this._device;
	}

	public restartApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths?: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			this.device.fileSystem.deleteFile("/Library/Preferences/ServerInfo.plist", deviceAppData.appIdentifier);
			let notificationProxyClient = this.$injector.resolve(iOSProxyServices.NotificationProxyClient, {device: this.device});
			notificationProxyClient.postNotification("com.telerik.app.refreshWebView");
			notificationProxyClient.closeSocket();
		}).future<void>()();
	}
}

export class AndroidLiveSyncService extends androidLiveSyncServiceLib.AndroidLiveSyncService implements IPlatformSpecificLiveSyncService {
	private static DEVICE_TMP_DIR_FORMAT_V2 = "/data/local/tmp/12590FAA-5EDD-4B12-856D-F52A0A1599F2/%s";
	private static DEVICE_PATH_SEPARATOR = "/";

	private _tmpRoots: IStringDictionary = {};

	constructor(private _device: Mobile.IDevice,
		private $config: IConfiguration,
		private $errors: IErrors,
	 	$fs: IFileSystem,
		private $injector: IInjector,
		$mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $project: Project.IProject,
		private $server: Server.IServer) {
			super(<Mobile.IAndroidDevice>_device, $fs, $mobileHelper);
		}

	public restartApplication(deviceAppData: Mobile.IDeviceAppData, localToDevicePaths?: Mobile.ILocalToDevicePathData[]): IFuture<void> {
		return (() => {
			let liveSyncVersion = this.getLiveSyncVersion(deviceAppData.appIdentifier).wait();
			let liveSyncRoot = this.getLiveSyncRoot(deviceAppData.appIdentifier, liveSyncVersion);
			let dirs:IStringDictionary = Object.create(null);

			_.each(localToDevicePaths, (localToDevicePathData: Mobile.ILocalToDevicePathData) => {
				let relativeToProjectBasePath = helpers.fromWindowsRelativePathToUnix(localToDevicePathData.getRelativeToProjectBasePath());
				let devicePath = this.$mobileHelper.buildDevicePath(liveSyncRoot, relativeToProjectBasePath);

				this.device.fileSystem.transferFile(localToDevicePathData.getLocalPath(), devicePath).wait();

				if (liveSyncVersion === 2) {
					let parts = relativeToProjectBasePath.split(AndroidLiveSyncService.DEVICE_PATH_SEPARATOR);
					let currentPath = "";
					_.each(parts, p => {
						if(p !== "") {
							currentPath = this.$mobileHelper.buildDevicePath(currentPath, p);
							if(!dirs[currentPath]) {
								dirs[currentPath] = currentPath;
								this.ensureFullAccessPermissions(this.$mobileHelper.buildDevicePath(liveSyncRoot, currentPath)).wait();
							}
						}
					});
				}
			});

			this.ensureFullAccessPermissions(liveSyncRoot).wait();

			let commands: string[];
			if(this.$options.watch || this.$options.file) {
				commands = [ this.liveSyncCommands.SyncFilesCommand(), this.liveSyncCommands.RefreshCurrentViewCommand() ] ;
			} else {
				let liveSyncToken = this.$server.cordova.getLiveSyncToken(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName).wait();

				let liveSyncDeviceAppData = (<ILiveSyncDeviceAppData>deviceAppData);
				let liveSyncUrl = liveSyncDeviceAppData.liveSyncFormat ? util.format(liveSyncDeviceAppData.liveSyncFormat, this.$config.AB_SERVER, liveSyncToken) : this.$project.getLiveSyncUrl();

				commands = [ this.liveSyncCommands.DeployProjectCommand(liveSyncUrl), this.liveSyncCommands.ReloadStartViewCommand() ];
			}

			this.createCommandsFileOnDevice(liveSyncRoot, commands).wait();

			this.device.adb.sendBroadcastToDevice("com.telerik.LiveSync", { "app-id": deviceAppData.appIdentifier }).wait();
		}).future<void>()();
	}

	private getLiveSyncVersion(appIdentifier: string): IFuture<number> {
		return this.device.adb.sendBroadcastToDevice(constants.CHECK_LIVESYNC_INTENT_NAME, {"app-id": appIdentifier});
	}

	private getLiveSyncRoot(appIdentifier: string, liveSyncVersion: number): string {
		if(!this._tmpRoots[appIdentifier]) {
			if (liveSyncVersion === 2) {
				this._tmpRoots[appIdentifier] = util.format(AndroidLiveSyncService.DEVICE_TMP_DIR_FORMAT_V2, appIdentifier);
			} else if (liveSyncVersion === 3) {
				this._tmpRoots[appIdentifier] = `${util.format(liveSyncConstants.DEVICE_TMP_DIR_FORMAT_V3, appIdentifier)}${AndroidLiveSyncService.DEVICE_PATH_SEPARATOR}${liveSyncConstants.LIVESYNC_FOLDER_GUID}`;
			} else {
				this.$errors.fail("Unsupported LiveSync version: %d", liveSyncVersion);
			}
		}

		return this._tmpRoots[appIdentifier];
	}

	 private ensureFullAccessPermissions(devicePath: string): IFuture<void> {
		return this.device.adb.executeShellCommand(["chmod", "0777", `${devicePath}`]);
	}
}

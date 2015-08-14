///<reference path="../.d.ts"/>
"use strict";

import deviceAppDataBaseLib = require("../common/mobile/device-app-data/device-app-data-base");
import Future = require("fibers/future");
import querystring = require("querystring");
import * as path from "path";

let ANDROID_PROJECT_PATH = "/mnt/sdcard/Icenium/";
let IOS_PROJECT_PATH = "/Documents";
let NATIVESCRIPT_ION_APP_IDENTIFIER = "com.telerik.NativeScript";

export class AndroidAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements ILiveSyncDeviceAppData {
	private static ANDROID_CHECK_LIVE_SYNC_INTENT = "com.telerik.IsLiveSyncSupported";

	constructor(_appIdentifier: string) {
		super(_appIdentifier);
	}

	public get deviceProjectRootPath(): string {
		return this.getDeviceProjectRootPath(path.join(ANDROID_PROJECT_PATH, this.appIdentifier));
	}

	public get liveSyncFormat(): string {
		return null;
	}

	public encodeLiveSyncHostUri(hostUri: string): string {
		return hostUri;
	}

	public getLiveSyncNotSupportedError(device: Mobile.IDevice): string {
		return `You can't LiveSync on device with id ${device.deviceInfo.identifier}! Deploy the app with LiveSync enabled and wait for the initial start up before LiveSyncing.`;
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return (() => {
		 	return (<Mobile.IAndroidDevice>device).adb.sendBroadcastToDevice(AndroidAppIdentifier.ANDROID_CHECK_LIVE_SYNC_INTENT, { "app-id": this.appIdentifier }).wait() !== 0;
		}).future<boolean>()();
	}
}

export class AndroidCompanionAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements ILiveSyncDeviceAppData {
	constructor(_appIdentifier: string) {
		super("com.telerik.AppBuilder");
	}

	public get deviceProjectRootPath(): string {
		return this.getDeviceProjectRootPath(path.join(ANDROID_PROJECT_PATH, this.appIdentifier));
	}

	public get liveSyncFormat(): string {
		return "%s/Mist/MobilePackage/redirect?token=%s";
	}

	public encodeLiveSyncHostUri(hostUri: string): string {
		return hostUri;
	}

	public getLiveSyncNotSupportedError(device: Mobile.IDevice): string {
		return `Cannot LiveSync changes to the companion app. The companion app is not installed on ${device.deviceInfo.identifier}.`;
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return (() => {
			let applications = device.applicationManager.getInstalledApplications().wait();
			return _.contains(applications, this.appIdentifier);
		}).future<boolean>()();
	}
}

export class AndroidNativeScriptCompanionAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements ILiveSyncDeviceAppData {
	constructor(_appIdentifier: string) {
		super(NATIVESCRIPT_ION_APP_IDENTIFIER);
	}

	public get deviceProjectRootPath(): string {
		return this.getDeviceProjectRootPath(path.join("/mnt/sdcard/Android/data", this.appIdentifier, "files"));
	}

	public get liveSyncFormat(): string {
		return null;
	}

	public encodeLiveSyncHostUri(hostUri: string): string {
		return hostUri;
	}

	public getLiveSyncNotSupportedError(device: Mobile.IDevice): string {
		return `Cannot LiveSync changes to the NativeScript companion app. The NativeScript companion app is not installed on ${device.deviceInfo.identifier}.`;
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return (() => {
			let applications = device.applicationManager.getInstalledApplications().wait();
			return _.contains(applications, this.appIdentifier);
		}).future<boolean>()();
	}
}

export class IOSAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements ILiveSyncDeviceAppData {
	constructor(_appIdentifier: string) {
		super(_appIdentifier);
	}

	public get deviceProjectRootPath(): string {
		return IOS_PROJECT_PATH;
	}

	get liveSyncFormat(): string {
		return null;
	}

	encodeLiveSyncHostUri(hostUri: string): string {
		return querystring.escape(hostUri);
	}

	getLiveSyncNotSupportedError(device: Mobile.IDevice): string {
		return "";
	}

	isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}
}

export class IOSCompanionAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements ILiveSyncDeviceAppData {
	constructor(private servedApp: string) {
		super("com.telerik.Icenium");
	}

	public get deviceProjectRootPath(): string {
		return IOS_PROJECT_PATH;
	}

	public get liveSyncFormat(): string {
		return "icenium://%s?LiveSyncToken=%s";
	}

	public encodeLiveSyncHostUri(hostUri: string): string {
		return querystring.escape(hostUri);
	}

	public getLiveSyncNotSupportedError(device: Mobile.IDevice): string {
		return "";
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}
}

export class IOSNativeScriptCompanionAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements ILiveSyncDeviceAppData {
	constructor(private servedApp: string) {
		super(NATIVESCRIPT_ION_APP_IDENTIFIER);
	}

	public get deviceProjectRootPath(): string {
		return IOS_PROJECT_PATH;
	}

	public get liveSyncFormat(): string {
		return "nativescript://%s?LiveSyncToken=%s";
	}

	public encodeLiveSyncHostUri(hostUri: string): string {
		return querystring.escape(hostUri);
	}

	public getLiveSyncNotSupportedError(device: Mobile.IDevice): string {
		return "";
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}
}

export class WP8CompanionAppIdentifier extends deviceAppDataBaseLib.DeviceAppDataBase implements ILiveSyncDeviceAppData {
	constructor() {
		super("{9155af5b-e7ed-486d-bc6b-35087fb59ecc}");
	}

	public get deviceProjectRootPath(): string {
		return ""; // this is used only on Android for Lollipop
	}

	public get liveSyncFormat(): string {
		return "%s/Mist/MobilePackage/redirect?token=%s";
	}

	public encodeLiveSyncHostUri(hostUri: string): string {
		return hostUri;
	}

	public isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}

	public getLiveSyncNotSupportedError(device: Mobile.IDevice): string {
		return "";
	}
}

export class DeviceAppDataProvider implements Mobile.IDeviceAppDataProvider {
	constructor(private $project: Project.IProject) { }

	public createFactoryRules(): IDictionary<Mobile.IDeviceAppDataFactoryRule> {
		let rules: IDictionary<IDictionary<Mobile.IDeviceAppDataFactoryRule>>= {
			Cordova: {
				Android: {
					vanilla: AndroidAppIdentifier,
					companion: AndroidCompanionAppIdentifier
				},
				iOS: {
					vanilla: IOSAppIdentifier,
					companion: IOSCompanionAppIdentifier
				},
				WP8: {
					vanilla: "",
					companion: WP8CompanionAppIdentifier
				}
			},
			NativeScript: {
				Android: {
					vanilla: AndroidAppIdentifier,
					companion: AndroidNativeScriptCompanionAppIdentifier
				},
				iOS: {
					vanilla: IOSAppIdentifier,
					companion: IOSNativeScriptCompanionAppIdentifier
				}
			}
		};

		return rules[this.$project.projectData.Framework];
	}
}
$injector.register("deviceAppDataProvider", DeviceAppDataProvider);

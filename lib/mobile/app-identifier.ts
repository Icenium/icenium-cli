///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Future = require("fibers/future");
import helpers = require("../helpers");
import util = require("util");

var ANDROID_PROJECT_PATH = "mnt/sdcard/Icenium/";
var ANDROID_NATIVESCRIPT_PROJECT_PATH = "data/data/";
var ANDROID_CHECK_LIVE_SYNC_INTENT = "com.telerik.IsLiveSyncSupported";
var ANDROID_ION_APP_IDENTIFIER = "com.telerik.AppBuilder";

var NATIVESCRIPT_ION_APP_IDENTIFIER = "com.telerik.NativeScript";

var IOS_PROJECT_PATH = "/Documents/";
var IOS_ION_APP_IDENTIFIER = "com.telerik.Icenium";

export class AndroidAppIdentifier implements Mobile.IAppIdentifier {
	constructor(private _appIdentifier: string) {}

	get appIdentifier(): string {
		return this._appIdentifier;
	}

	get deviceProjectPath(): string {
		return helpers.fromWindowsRelativePathToUnix(path.join(ANDROID_PROJECT_PATH, this.appIdentifier));
	}

	get liveSyncFormat(): string {
		return "icenium://%s?LiveSyncToken=%s";
	}

	getliveSyncNotSupportedError(device: Mobile.IDevice): string {
		return util.format("You can't LiveSync on %s! Deploy the app with LiveSync enabled and wait for the initial start up before LiveSyncing.", device.getIdentifier());
	}

	isLiveSyncSupported(device: any): IFuture<boolean> {
		return device.sendBroadcastToDevice(ANDROID_CHECK_LIVE_SYNC_INTENT,
			{ "app-id": this.appIdentifier });
	}
}

export class AndroidCompanionAppIdentifier implements Mobile.IAppIdentifier {
	constructor(private servedApp: string) {}

	get appIdentifier(): string {
		return ANDROID_ION_APP_IDENTIFIER;
	}

	get deviceProjectPath(): string {
		return helpers.fromWindowsRelativePathToUnix(path.join(ANDROID_PROJECT_PATH, this.appIdentifier));
	}

	get liveSyncFormat(): string {
		return "";
	}

	getliveSyncNotSupportedError(device: Mobile.IDevice): string {
		return util.format("Cannot LiveSync changes to the companion app. The companion app is not installed on %s.", device.getIdentifier());
	}

	isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return (() => {
			var applications = device.getInstalledApplications().wait();
			return _.contains(applications, this.appIdentifier);
		}).future<boolean>()();
	}
}

export class AndroidNativeScriptCompanionAppIdentifier implements Mobile.IAppIdentifier {
	constructor(private servedApp: string) { }

	get appIdentifier(): string {
		return NATIVESCRIPT_ION_APP_IDENTIFIER;
	}

	get deviceProjectPath(): string {
		return helpers.fromWindowsRelativePathToUnix(path.join(ANDROID_NATIVESCRIPT_PROJECT_PATH, this.appIdentifier, "files"));
	}

	get liveSyncFormat(): string {
		return "nativescript://%s?LiveSyncToken=%s";
	}

	getliveSyncNotSupportedError(device: Mobile.IDevice): string {
		return util.format("Cannot LiveSync changes to the NativeScript companion app. The NativeScript companion app is not installed on %s.", device.getIdentifier());
	}

	isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return (() => {
			var applications = device.getInstalledApplications().wait();
			return _.contains(applications, this.appIdentifier);
		}).future<boolean>()();
	}
}

export class IOSAppIdentifier implements Mobile.IAppIdentifier {
	constructor(private _appIdentifier: string) {}

	get appIdentifier(): string {
		return this._appIdentifier;
	}

	get deviceProjectPath(): string {
		return IOS_PROJECT_PATH;
	}

	get liveSyncFormat(): string {
		return "icenium://%s?LiveSyncToken=%s";
	}

	getliveSyncNotSupportedError(device: Mobile.IDevice): string {
		return "";
	}

	isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}
}

export class IOSCompanionAppIdentifier implements Mobile.IAppIdentifier {
	constructor(private servedApp: string) {}

	get appIdentifier(): string {
		return IOS_ION_APP_IDENTIFIER;
	}

	get deviceProjectPath(): string {
		return IOS_PROJECT_PATH;
	}

	get liveSyncFormat(): string {
		return "";
	}

	getliveSyncNotSupportedError(device: Mobile.IDevice): string {
		return "";
	}

	isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}
}

export class IOSNativeScriptCompanionAppIdentifier implements Mobile.IAppIdentifier {
	constructor(private servedApp: string) { }

	get appIdentifier(): string {
		return NATIVESCRIPT_ION_APP_IDENTIFIER;
	}

	get deviceProjectPath(): string {
		return IOS_PROJECT_PATH;
	}

	get liveSyncFormat(): string {
		return "nativescript://%s?LiveSyncToken=%s";
	}

	getliveSyncNotSupportedError(device: Mobile.IDevice): string {
		return "";
	}

	isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}

}

var factoryRules = {
	iOS: {
		Cordova: {
			companion: IOSCompanionAppIdentifier,
			vanilla: IOSAppIdentifier
		},
		NativeScript: {
			companion: IOSNativeScriptCompanionAppIdentifier,
		}
	},
	Android: {
		Cordova: {
			companion: AndroidCompanionAppIdentifier,
			vanilla: AndroidAppIdentifier
		},
		NativeScript: {
			companion: AndroidNativeScriptCompanionAppIdentifier,
		}
	}
};

export function createAppIdentifier(platform: string, appIdentifier: string, companion: boolean, projectType: number): Mobile.IAppIdentifier {
	var projectTypes: IProjectTypes = $injector.resolve("projectTypes");
	var projectTypeString = projectTypes[projectType];
	var ctor = factoryRules[platform][projectTypeString][companion ? "companion" : "vanilla"];
	return new ctor(appIdentifier);
}
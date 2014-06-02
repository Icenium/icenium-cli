///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Future = require("fibers/future");
import helpers = require("../helpers");
import util = require("util");

var ANDROID_PROJECT_PATH = "mnt/sdcard/Icenium/";
var ANDROID_CHECK_LIVE_SYNC_INTENT = "com.telerik.IsLiveSyncSupported";
var ANDROID_ION_APP_IDENTIFIER = "com.telerik.AppBuilder";

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

	getliveSyncNotSupportedError(device: any): string {
		return util.format("You can't LiveSync on %s! Deploy the app with LiveSync enabled and wait for the initial start up before LiveSyncing.", device.identifier);
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

	getliveSyncNotSupportedError(device: any): string {
		return util.format("Cannot LiveSync changes to the companion app. The companion app is not installed on %s.", device.identifier);
	}

	isLiveSyncSupported(device: any): IFuture<boolean> {
		return (() => {
			var applications = device.installedApplications.wait();
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

	getliveSyncNotSupportedError(device: any): string {
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

	getliveSyncNotSupportedError(device: any): string {
		return "";
	}

	isLiveSyncSupported(device: Mobile.IDevice): IFuture<boolean> {
		return Future.fromResult(true);
	}

}

var factoryRules = {
	iOS: {
		companion: IOSCompanionAppIdentifier,
		vanilla: IOSAppIdentifier
	},
	Android: {
		companion: AndroidCompanionAppIdentifier,
		vanilla: AndroidAppIdentifier
	}
};

export function createAppIdentifier(platform: string, appIdentifier: string, companion: boolean): Mobile.IAppIdentifier {
	var ctor = factoryRules[platform][companion ? "companion" : "vanilla"];
	return new ctor(appIdentifier);
}
///<reference path="../.d.ts"/>
"use strict";

import helpers = require("../helpers");

export enum DevicePlatforms {
	iOS,
	Android,
	WP8
}

export var platformCapabilities: {[key: string]: Mobile.IPlatformCapabilities } = {
	iOS: {
		wirelessDeploy: true,
		cableDeploy: true,
		companion: true,
		publishTelerikAppManager: true,
		hostPlatformsForDeploy: ["win32", "darwin"]
	},
	Android: {
		wirelessDeploy: true,
		cableDeploy: true,
		companion: true,
		publishTelerikAppManager: true,
		hostPlatformsForDeploy: ["win32", "darwin", "linux"]
	},
	WP8: {
		wirelessDeploy: true,
		cableDeploy: false,
		companion: false,
		publishTelerikAppManager: false,
		hostPlatformsForDeploy: ["win32"]
	}
};

export var PlatformNames = Object.keys(platformCapabilities);

export class LocalToDevicePathData implements Mobile.ILocalToDevicePathData {
	constructor(private localPath: string, private devicePath: string, private relativeToProjectBasePath: string) {}

	getLocalPath(): string { return this.localPath; }
	getDevicePath(): string { return this.devicePath; }
	getRelativeToProjectBasePath(): string { return this.relativeToProjectBasePath; }
}

export function isAndroidPlatform(platform) {
	return DevicePlatforms[DevicePlatforms.Android].toLowerCase() === platform.toLowerCase();
}

export function isiOSPlatform(platform) {
	return DevicePlatforms[DevicePlatforms.iOS].toLowerCase() === platform.toLowerCase();
}

export function isWP8Platform(platform: string): boolean {
	return DevicePlatforms[DevicePlatforms.WP8].toLowerCase() === platform.toLowerCase();
}

export function normalizePlatformName(platform: string): string {
	if (isAndroidPlatform(platform)) {
		return "Android";
	} else if (isiOSPlatform(platform)) {
		return "iOS";
	} else if (isWP8Platform(platform)) {
		return "WP8";
	}

	return undefined;
}

export function isPlatformSupported(platform: string) {
	var platformName = normalizePlatformName(platform);
	return _.contains(platformCapabilities[platformName].hostPlatformsForDeploy, process.platform);
}

export function generateWP8GUID() {
	return "{" + require("node-uuid").v4() + "}";
}

export function validatePlatformName(platform: string, $errors: IErrors): string {
	if (!platform) {
		$errors.fail("No device platform specified.");
	}

	var normalizedPlatform = normalizePlatformName(platform);
	if (!normalizedPlatform) {
		$errors.fail("'%s' is not a valid device platform. Valid platforms are %s.",
			platform, helpers.formatListOfNames(Object.keys(platformCapabilities)));
	}
	return normalizedPlatform;
}

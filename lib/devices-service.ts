///<reference path=".d.ts"/>

"use strict";
import helpers = require("./helpers");
import log = require("./log");
import Q = require("q");
import util = require("util");
var options:any = require("./options");
import path = require("path");
import platforms = require("./platforms");
import _ = require("underscore");

export function listDevices(platform) {
	var platformServices = getPlatformServices(platform);
	var listers = _.map(platformServices, function(platformService:any) {
		return platformService.requestAllDevices()
			.then(function (devices) {
				printDevices(platformService, devices);
			})
			.catch(function (error) {
				log.trace(error);
			});
	});

	return Q.all(listers);
}

export function openDeviceLogStream(platform) {
	if (!platforms.isSupported(platform)) {
		printNotSupportedPlatformMessage(platform);
	} else if(platform === undefined) {
		printPlatformIsRequiredOptionMessage();
	}
	else {
		execute(platform, "open-device-log-stream", function() {
			var deviceId = getDeviceId();
			if (isDeviceIdEmpty(deviceId)) {
				printNotFoundDeviceMessage();
			} else {
				var platformService = platforms.get(platform);
				requestDeviceById(platformService, deviceId)
					.then(function (device) {
						platformService.openLogStream(device, function (error, data) {
							if (error) {
								log.trace(error);
							} else {
								console.log(data);
							}
						});
					})
					.done();
			}
		});
	}
}

function requestDeviceById(platformService, deviceId) {
	if (deviceId.index !== null) {
		return platformService.requestDeviceByIndex(deviceId.index);
	} else if (deviceId.serialNumber !== null) {
		return platformService.requestDeviceBySerialNumber(deviceId.serialNumber);
	}
}

export function deploy(platform, packageFile, packageName, provisionedDevices) {
	var platformServices = getPlatformServices(platform);
	var deployers = _.map(platformServices, function(platformService:any) {
		return platformService.install(packageFile, packageName, provisionedDevices);
	});

	return Q.all(deployers);
}

export function sync(platform, localProjectPath, projectFiles, appIdentifier) {
	if (!platforms.isSupported(platform)) {
		printNotSupportedPlatformMessage(platform);
	} else if(!hasDeviceId()) {
		return syncAllDevices(platform, localProjectPath, projectFiles, appIdentifier);
	} else {
		var deviceId = getDeviceId();
		if (isDeviceIdEmpty(deviceId)) {
			printNotFoundDeviceMessage();
		} else {
			var platformService = platforms.get(platform);
			return platformService.requestDeviceById(deviceId)
				.then(function (device) {
					var platformSpecificProjectPath = platformService.getDeviceProjectPath(appIdentifier);
					var localToDevicePaths = getLocalToDevicePaths(localProjectPath, projectFiles, platformSpecificProjectPath);
					return platformService.sync(localToDevicePaths, device, appIdentifier);
				});
		}
	}
}

function syncAllDevices(platform, localProjectPath, projectFiles, appIdentifier) {
	var platformServices = getPlatformServices(platform);
	var syncers = _.map(platformServices, function (platformService:any) {
		var platformSpecificProjectPath = platformService.getDeviceProjectPath(appIdentifier);
		var localToDevicePaths = getLocalToDevicePaths(localProjectPath, projectFiles, platformSpecificProjectPath);
		return platformService.sync(localToDevicePaths, null, appIdentifier);
	});

	return Q.all(syncers);
}

function getLocalToDevicePaths(localProjectPath, projectFiles, deviceProjectPath) {
	var localToDevicePaths = projectFiles.map(function (projectFile) {
		var relativeToProjectBasePath = helpers.getRelativeToRootPath(localProjectPath, projectFile);
		var deviceDirPath = path.dirname(path.join(deviceProjectPath, relativeToProjectBasePath));
		var localToDevicePath = {localPath: projectFile, devicePath: fromWindowsToUnixFilePath(deviceDirPath), relativeToProjectBasePath: relativeToProjectBasePath};
		return localToDevicePath;
	});
	return localToDevicePaths;
}

function fromWindowsToUnixFilePath(filePath) {
	var unixFilePath = filePath.replace(/\\/g, "/");
	return unixFilePath;
}

function hasDeviceId() {
	return options.device;
}

function getDeviceId() {
	var deviceId = { index: null, serialNumber: null };
	if (options.device) {
		if (helpers.isNumber(options.device)) {
			deviceId.index = parseInt(options.device);
		} else {
			deviceId.serialNumber = options.device;
		}
	} else {
		deviceId.index = 1;
	}
	return deviceId;
}

function isDeviceIdEmpty(deviceId) {
	return !deviceId ||
		(!deviceId.index && !deviceId.serialNumber);
}

function getPlatformServices(platform) {
	if (platform) {
		if (platforms.isSupported(platform)) {
			var result = {};
			result[platform] = platforms.get(platform);
			return result;
		} else {
			printNotSupportedPlatformMessage(platform);
			return null;
		}
	} else {
		return platforms.get();
	}
}

function printDevices(platformService, devices) {
	var platformName = platformService.getPlatformName();
	console.log(platformName + " devices:");
	devices.forEach(function (device, index) {
		console.log(util.format("#%d: '%s'", index + 1, platformService.getDeviceName(device)));
	});
}

function printNotSupportedPlatformMessage(platform) {
	console.log(util.format("%s is not supported.", platform));
}

function printPlatformIsRequiredOptionMessage() {
	console.log(util.format("Please specify platform. Choose one of the following: "));
	platforms.getPlatformsNames().forEach(function(platform){
		console.log(util.format("# %s", platform));
	});
}

function printNotFoundDeviceMessage() {
	console.log("The device was not found.");
}

function execute(platform, commandName, commandCallback) {
	hasDevices(platform)
		.then(function(result) {
			if (result) {
				commandCallback();
			} else {
				log.error(util.format("%s cannot be executed because there are 0 connected %s devices", commandName, platform || ""));
			}
		})
		.done();
}

export function hasDevices(platform) {
	var platformsServices = getPlatformServices(platform);
	return Q.fcall(hasDevicesOfPlatforms, _.toArray(platformsServices), 0);
}

function hasDevicesOfPlatforms(platformsServicesArray: any[], startIndex: number): boolean {
	if (platformsServicesArray.length - startIndex > 0) {
		var platformsService = platformsServicesArray[startIndex];
		return platformsService.hasDevices()
			.then(function(result) {
				if (result) {
					return true;
				} else {
					return hasDevicesOfPlatforms(platformsServicesArray, startIndex + 1);
				}
			});
	} else {
		return false;
	}
}

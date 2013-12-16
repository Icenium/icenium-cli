(function() {
	"use strict";
	var helpers = require("./helpers"),
		log = require("./log"),
		Q = require("q"),
		util = require("util"),
		options = require("./options"),
		path = require("path"),
		platforms = require("./platforms"),
		_ = require("underscore");

	function listDevices(platform) {
		var platformServices = getPlatformServices(platform);
		var listers = _.map(platformServices, function(platformService) {
			return platformService.requestAllDevices()
				.then(function (devices) {
					var currentPlatform = platform === undefined ? platformService.getPlatformName() : platform;
					currentPlatform = currentPlatform.toLowerCase();
					printDevices(currentPlatform, devices);
				})
				.catch(function (error) {
					log.trace(error);
				});
		});

		return Q.all(listers);
	}

	function openDeviceLogStream(platform) {
		if (!platforms.isSupported(platform)) {
			printNotSupportedPlatformMessage(platform);
		} else if(platform === undefined) {
			printPlatformIsRequiredOptionMessage();
		} else {
			var deviceId = getDeviceId();
			if (isDeviceIdEmpty(deviceId)) {
				printNotFoundDeviceMessage();
			} else {
				var platformService = platforms.get(platform);
				platformService.requestDeviceById(deviceId)
				.then(function (device) {
					platformService.openLogStream(device, function (error, data) {
						if (error) {
							log.trace(error);
						}
						else {
							console.log(data);
						}
					});
				})
				.done();
			}
		}
	}

	function deploy(platform, packageFile, packageName, provisionedDevices) {
		var platformServices = getPlatformServices(platform);
		var deployers = _.map(platformServices, function(platformService) {
			return platformService.install(packageFile, packageName, provisionedDevices);
		});

		return Q.all(deployers);
	}

	function sync(platform, localProjectPath, projectFiles, appIdentifier) {
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
		var syncers = _.map(platformServices, function (platformService) {
			var platformSpecificProjectPath = platformService.getDeviceProjectPath(appIdentifier);
			var localToDevicePaths = getLocalToDevicePaths(localProjectPath, projectFiles, platformSpecificProjectPath);
			return platformService.sync(localToDevicePaths, appIdentifier);
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
			}
		} else {
			return platforms.get();
		}
	}

	function printDevices(platformName, devices) {
		console.log(platformName + " devices:");
		devices.forEach(function (device, index) {
			console.log(util.format("#%d: '%s'", index + 1, device));
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

	exports.listDevices = listDevices;
	exports.openDeviceLogStream = openDeviceLogStream;
	exports.deploy = deploy;
	exports.sync = sync;
})();
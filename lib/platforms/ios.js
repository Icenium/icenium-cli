(function() {
	"use strict";
	var helpers = require("./../helpers"),
		appNotifications = require("./app-notifications"),
		devicesService = require("./ios/ios-core/ios-devices-service"),
		log = require("./../log"),
		Q = require("q"),
		_ = require("underscore"),
		isStartedListeningForDevices = null;

	function startListeningForDevices() {
		if(isStartedListeningForDevices === null) {
			isStartedListeningForDevices = true;
			devicesService.startListeningForDevices();
		}
	}

    function init() {
		var iTunesInstallationInfo = require("./ios/ios-core/iTunes-installation-info"),
			iTunesErrorMessage = iTunesInstallationInfo.getErrorMessage();

        if(iTunesErrorMessage !== null) {
			helpers.abort(iTunesErrorMessage);
        }
    }

	function installOnDevice(device, packageFile, packageName, InstallationProxyClient) {
		log.trace("start installation of '%s' on device '%s'", packageName, device.deviceId);
		var installationProxyClient = new InstallationProxyClient(device);
		installationProxyClient.transferApplication(packageFile);
		installationProxyClient.installApplication(packageFile);
	}

	function isAllowedToInstallOnDevice(device, provisionedDevices) {
		var isFoundDeviceIdInProvision = _.find(provisionedDevices, function(dev){
			return dev === device.deviceId;
		});

		if(!isFoundDeviceIdInProvision || isFoundDeviceIdInProvision === undefined) {
			console.log("The device '%s' is not included in the provisioning profile.", device.deviceId);
			return false;
		}

		return true;
	}

	function install(packageFile,packageName, provisionedDevices) {
		init();
		var InstallationProxyClient = require("./ios/ios-mobile-device/installation-proxy/installation-proxy-client");

		return requestAllDevices()
			.then(function(devices){
				devices.forEach(function(device){
					if(isAllowedToInstallOnDevice(device, provisionedDevices)) {
						installOnDevice(device, packageFile, packageName, InstallationProxyClient);
					}
				});
			});
	}

	function syncDevice(device, localToDevicePaths, appIdentifier, HouseArrestClient, NotificationProxyClient) {
		var houseArrestClient = new HouseArrestClient(device),
			afcClientForAppDocuments = houseArrestClient.GetAfcClientForAppDocuments(appIdentifier)

		try {
			localToDevicePaths.forEach(function(data){
				afcClientForAppDocuments.transferFile(data.localPath, data.devicePath, data.relativeToProjectBasePath);
			});
		}
		catch(ex) {
			throw  ex;
		}

		var notificationProxyClient = new NotificationProxyClient(device);
		notificationProxyClient.postNotification(appNotifications.ios.APP_REFRESH_WEBVIEW);
	}

	function sync(localToDevicePaths, device, appIdentifier) {
		init();

		var HouseArrestClient = require("./ios/ios-mobile-device/house-arrest/house-arrest-client"),
			NotificationProxyClient = require("./ios/ios-mobile-device/notification-proxy/notification-proxy-client");

		if(device) {
			return syncDevice(device, localToDevicePaths, appIdentifier, HouseArrestClient, NotificationProxyClient);
		}

		return requestAllDevices()
			.then(function(devices){
				devices.forEach(function(iOSDevice){
					syncDevice(iOSDevice, localToDevicePaths, appIdentifier, HouseArrestClient, NotificationProxyClient);
				});
			});
	}

	function requestDeviceByIndex(deviceIndex) {
		return requestAllDevices()
			.then(function(devices) {
				if (deviceIndex >= 1 && deviceIndex <= devices.length) {
					return devices[deviceIndex - 1];
				}
				else {
					return null;
				}
			});
	}

	function requestDeviceBySerialNumber(deviceId) {
		return requestAllDevices()
			.then(function(devices) {
				var result = null;
				devices.forEach(function(device){
					if(device.deviceId === deviceId) {
						result = device;
					}
				});
				return result;
			});
	}

	function requestAllDevices() {
		startListeningForDevices();
		return Q.fcall(function(){
			return devicesService.getAllDevices();
		});
	}

	function openLogStream(iOSDevice) {
		init();

		console.log(iOSDevice);

        var IOSSyslog = require("./ios/ios-core/ios-syslog"),
			iOSSyslog = new IOSSyslog(iOSDevice);
        iOSSyslog.read();
	}

	function getDeviceProjectPath() {
		return "/Documents/";
	}

	function getPlatformName() {
		return "ios";
	}

	function hasDevices() {
		return requestAllDevices()
			.then(function(devices){
				return devices.length > 0;
			});
	}

	function getDeviceName(device) {
		return device.deviceId;
	}

	exports.install = install;
	exports.sync = sync;
	exports.requestDeviceByIndex = requestDeviceByIndex;
	exports.requestDeviceBySerialNumber = requestDeviceBySerialNumber;
	exports.openLogStream = openLogStream;
	exports.getDeviceProjectPath = getDeviceProjectPath;
	exports.requestAllDevices = requestAllDevices;
	exports.getPlatformName = getPlatformName;
	exports.hasDevices = hasDevices;
	exports.getDeviceName = getDeviceName;
})();
(function() {
	"use strict";
	var	helpers = require("./../helpers"),
		appNotifications = require("./app-notifications");

    function init() {
		var iTunesInstallationInfo = require("./ios/ios-core/iTunes-installation-info"),
			iTunesErrorMessage = iTunesInstallationInfo.getErrorMessage();

        if(iTunesErrorMessage !== null) {
			helpers.abort(iTunesErrorMessage);
        }
    }

	function install(packageFile) {
		init();

		var iOSDevice = require("./ios/ios-core/ios-device"),
			InstallationProxyClient = require("./ios/ios-mobile-device/installation-proxy/installation-proxy-client");

		iOSDevice.waitForDevice();
		console.log(iOSDevice.getDeviceId());

		var	installationProxyClient = new InstallationProxyClient();
		installationProxyClient.deployApplication(packageFile);
	}

	function sync(localToDevicePaths, appIdentifier) {
		init();

		var iOSDevice = require("./ios/ios-core/ios-device");
		iOSDevice.waitForDevice();

		var HouseArrestClient = require("./ios/ios-mobile-device/house-arrest/house-arrest-client"),
			houseArrestClient = new HouseArrestClient(),
			afcClientForAppDocuments = houseArrestClient.GetAfcClientForAppDocuments(appIdentifier);

        try {
            localToDevicePaths.forEach(function(data){
                afcClientForAppDocuments.transferFile(data.localPath, data.devicePath, data.relativeToProjectBasePath);
            });
        } catch(ex) {
            throw ex;
        }

		var NotificationProxyClient = require("./ios/ios-mobile-device/notification-proxy/notification-proxy-client"),
			notificationProxyClient = new NotificationProxyClient();
		notificationProxyClient.postNotification(appNotifications.ios.APP_REFRESH_WEBVIEW);
	}

	function requestDeviceById() {
		var iOSDevice = require("./ios/ios-core/ios-device");
		return iOSDevice.getDeviceId();
	}

	// function requestAllDevices() {
	// 	var iOSDevicesService = require("./ios/ios-core/ios-devices-service");
	// 	return iOSDevicesService.listDevices();
	// }

	function openLogStream() {
		init();

        var iOSDevice = require("./ios/ios-core/ios-device");
        iOSDevice.waitForDevice();

        var iOSSyslog = require("./ios/ios-core/ios-syslog");
        iOSSyslog.read();
	}

	function getDeviceProjectPath() {
		return "/Documents/";
	}

	exports.install = install;
	exports.sync = sync;
	exports.requestDeviceById = requestDeviceById;
	exports.openLogStream = openLogStream;
	exports.getDeviceProjectPath = getDeviceProjectPath;

})();
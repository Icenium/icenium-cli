(function() {
	"use strict";
	var mobileDevice = require("./../../ios-core/mobile-device"),
		coreFoundation = require("./../../ios-core/core-foundation"),
		iOSCore = require("./../../ios-core/ios-core"),
		osPath = require("path"),
		iOSDevice = require("./../../ios-core/ios-device"),
		mobileServices = require("./../mobile-services");

	var kCFNumberSInt32Type = 3;

	function InstallationProxyClient() {

	}

	function showStatus(action, dictionary) {
		var show = action;

		var percentComplete = coreFoundation.functions.CFDictionaryGetValue(dictionary, coreFoundation.createCFString("PercentComplete"));
		if (iOSCore.address(percentComplete) !== 0) {
			var percent = iOSCore.alloc(iOSCore.intType);
			coreFoundation.functions.CFNumberGetValue(percentComplete, kCFNumberSInt32Type, percent);
			show += " " + iOSCore.deref(percent);
		}

		show += " " + coreFoundation.convertCFStringToCString(coreFoundation.functions.CFDictionaryGetValue(dictionary, coreFoundation.createCFString("Status")));
		var path = coreFoundation.functions.CFDictionaryGetValue(dictionary, coreFoundation.createCFString("Path"));

		if (iOSCore.address(path) !== 0) {
			show += coreFoundation.convertCFStringToCString(path);
		}
		console.log(show);
	}

	function transferCallback(dictionary) {
		showStatus("Transferring", dictionary);
	}

	function installCallback(dictionary) {
		showStatus("Installing", dictionary);
	}

	// function uninstallCallback(dictionary) {
	// 	showStatus("Uninstalling", dictionary);
	// }

	function transferApplication(path) {
		var service = iOSDevice.startService(mobileServices.APPLE_FILE_CONNECTION);
		var normalizedPath = osPath.normalize(path);
		var resolvedPath = osPath.resolve(normalizedPath);
		try {
			var result = mobileDevice.functions.AMDeviceTransferApplication(service, coreFoundation.createCFString(resolvedPath), null, iOSCore.am_device_install_application_callback.toPointer(transferCallback), null);
			if (result !== 0) {
				throw "Unable to transfer application: " + result;
			}
		} finally {
			iOSDevice.stopService(service);
		}
	}

	function installApplication(path) {
		var afc = iOSDevice.startService(mobileServices.INSTALLATION_PROXY);
		try {
			var count = 1;
			var keys = iOSCore.alloc(iOSCore.voidPtr, coreFoundation.createCFString("PackageType"));
			var values = iOSCore.alloc(iOSCore.voidPtr, coreFoundation.createCFString("Developer"));

			var options = coreFoundation.functions.CFDictionaryCreate(null, keys, values, count, coreFoundation.functions.kCFTypeDictionaryKeyCallBacks, coreFoundation.functions.kCFTypeDictionaryValueCallBacks);
			var result = mobileDevice.functions.AMDeviceInstallApplication(afc, coreFoundation.createCFString(path), options, iOSCore.am_device_install_application_callback.toPointer(installCallback), null);
			if (result !== 0) {
				throw "Unable to install application: " + result;
			}
		} finally {
			iOSDevice.stopService(afc);
		}
	}

	InstallationProxyClient.prototype.deployApplication = function(path) {
		transferApplication(path);
		installApplication(path);
	};

	module.exports = InstallationProxyClient;

})();
(function() {
	"use strict";
	var PlistService = require("./../../ios-core/plist-service"),
		AfcClient = require("./../../ios-core/afc/afc-client"),
		mobileDevice = require("./../../ios-core/mobile-device"),
		coreFoundation = require("./../../ios-core/core-foundation"),
		iOSCore = require("./../../ios-core/ios-core"),
		log = require("./../../../../log"),
		path = require("path"),
		mobileServices = require("./../mobile-services");

	var kCFNumberSInt32Type = 3;

	function InstallationProxyClient(device) {
		Object.defineProperty(this, "iOSDevice", {
			get: function() {
				return device;
			}
		});
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
		var currentFilePath = coreFoundation.functions.CFDictionaryGetValue(dictionary, coreFoundation.createCFString("Path"));

		if (iOSCore.address(currentFilePath) !== 0) {
			show += coreFoundation.convertCFStringToCString(currentFilePath);
		}
		console.log(show);
	}

	function transferCallback(dictionary) {
		showStatus("Transferring", dictionary);
	}

	function installCallback(dictionary) {
		showStatus("Installing", dictionary);
	}

	InstallationProxyClient.prototype.deployApplicationOnIOS5 = function(packageFile, device) {
		var afcService = this.iOSDevice.startService(mobileServices.APPLE_FILE_CONNECTION);
		var afcClient = new AfcClient(afcService);

		var devicePath = path.join("PublicStaging", "app.ipa");
		devicePath = devicePath.replace(/\\/g, "/");
		afcClient.transferPackage(packageFile, devicePath, function(){
			var plistService = new PlistService(device, mobileServices.INSTALLATION_PROXY);

			var plist = {
				type: "dict",
				value: {
					"Command": {
						type: "string",
						value: "Install"
					},
					"PackagePath": {
						type: "string",
						value: devicePath
					},
					"ClientOptions": {
						type: "dict",
						value: { }
					}
				}
			};

			plistService.sendMessage(plist);
			var reply = plistService.receiveMessage();

			while(reply.indexOf("PercentComplete") > 0) {
				reply = plistService.receiveMessage();
				log.trace(reply);
			}
		});
	};

	InstallationProxyClient.prototype.transferApplication = function(packageFile) {
		var service = this.iOSDevice.startService(mobileServices.APPLE_FILE_CONNECTION);
		var normalizedPath = path.normalize(packageFile);
		var resolvedPath = path.resolve(normalizedPath);
		try {
			var result = mobileDevice.functions.AMDeviceTransferApplication(service, coreFoundation.createCFString(resolvedPath), null, iOSCore.am_device_install_application_callback.toPointer(transferCallback), null);
			if (result !== 0) {
				throw "Unable to transfer application: " + result;
			}
		} finally {
			this.iOSDevice.stopService(service);
		}
	};

	InstallationProxyClient.prototype.installApplication = function(packageFile) {
		var afc = this.iOSDevice.startService(mobileServices.INSTALLATION_PROXY);
		try {
			var count = 1;
			var keys = iOSCore.alloc(iOSCore.voidPtr, coreFoundation.createCFString("PackageType"));
			var values = iOSCore.alloc(iOSCore.voidPtr, coreFoundation.createCFString("Developer"));

			var options = coreFoundation.functions.CFDictionaryCreate(null, keys, values, count, coreFoundation.functions.kCFTypeDictionaryKeyCallBacks, coreFoundation.functions.kCFTypeDictionaryValueCallBacks);
			var result = mobileDevice.functions.AMDeviceInstallApplication(afc, coreFoundation.createCFString(packageFile), options, iOSCore.am_device_install_application_callback.toPointer(installCallback), null);
			if (result !== 0) {
				throw "Unable to install application: " + result;
			}
		} finally {
			this.iOSDevice.stopService(afc);
		}
	};

	module.exports = InstallationProxyClient;

})();
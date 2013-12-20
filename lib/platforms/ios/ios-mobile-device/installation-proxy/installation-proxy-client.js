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

	function InstallationProxyClient(device) {
		Object.defineProperty(this, "iOSDevice", {
			get: function() {
				return device;
			}
		});
	}

	InstallationProxyClient.prototype.deployApplication = function(packageFile, device) {
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

	module.exports = InstallationProxyClient;

})();
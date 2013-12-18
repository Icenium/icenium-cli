(function() {
    "use strict";
    var PlistService = require("./../../ios-core/plist-service"),
        mobileServices = require("./../mobile-services");

    function NotificationProxyClient(device) {
		Object.defineProperty(this, "iOSDevice", {
			get: function() {
				return device;
			}
		});
    }

    NotificationProxyClient.prototype.postNotification = function(notificationName) {

		this._plistService = new PlistService(this.iOSDevice, mobileServices.NOTIFICATION_PROXY);

		var result = this._plistService.sendMessage({
            type: "dict",
            value: {
                "Command": {
                    type: "string",
                    value: "PostNotification"
                },
                "Name": {
                    type: "string",
                    value: notificationName
                }
            }
        });

        return result;
    };

    module.exports = NotificationProxyClient;

})();
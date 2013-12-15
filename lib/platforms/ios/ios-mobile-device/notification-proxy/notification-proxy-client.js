(function() {
    "use strict";
    var PlistService = require("./../../ios-core/plist-service"),
        mobileServices = require("./../mobile-services");

    function NotificationProxyClient() {
        this._plistService = new PlistService(mobileServices.NOTIFICATION_PROXY);
    }

    NotificationProxyClient.prototype.postNotification = function(notificationName) {
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
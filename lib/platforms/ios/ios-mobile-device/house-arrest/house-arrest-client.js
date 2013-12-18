(function(){
    "use strict";
    var PlistService = require("./../../ios-core/plist-service"),
        mobileServices = require("./../mobile-services"),
        AfcClient = require("./../../ios-core/afc/afc-client");

    function HouseArrestClient(device) {
		Object.defineProperty(this, "iOSDevice", {
			get: function() {
				return device;
			}
		});
    }

    function getAfcClientCore(device, command, applicationIdentifier) {
        var plistService = new PlistService(device, mobileServices.HOUSE_ARREST);

        var plist = {
            type: "dict",
            value: {
                "Command": {
                    type: "string",
                    value: command
                },
                "Identifier": {
                    type: "string",
                    value: applicationIdentifier
                }
            }
        };

        plistService .sendMessage(plist);

        var reply = plistService .receiveMessage();

        if(reply.indexOf("Status") < 0 || reply.indexOf("Complete") < 0) {
            throw "Unable to start house arrest service";
        }

        return new AfcClient(plistService._service);
    }

    HouseArrestClient.prototype.GetAfcClientForAppDocuments = function(applicationIdentifier) {
        return getAfcClientCore(this.iOSDevice,"VendDocuments", applicationIdentifier);
    };

    HouseArrestClient.prototype.GetAfcClientForAppContainer = function(applicationIdentifier) {
        return getAfcClientCore(this.iOSDevice, "VendContainer", applicationIdentifier);
    };

    module.exports = HouseArrestClient;

})();
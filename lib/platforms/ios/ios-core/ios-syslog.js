(function() {
    "use strict";
    var WinSocketWrapper = require("./win-socket-wrapper"),
        mobileServices = require("./../ios-mobile-device/mobile-services"),
        iOSDevice = require("./ios-device"),
        iOSCore = require("./ios-core"),
        os = require("os"),
        fs = require("fs");

    var regex = ".*?((Cordova.{3}|Icenium Ion)\\[\\d+\\] <Warning>: )";

    function IOSSyslog() {
        this._service = iOSDevice.startService(mobileServices.SYSLOG);
        this._socket = new WinSocketWrapper(this._service);
    }

    IOSSyslog.prototype.read = function() {
        var data = this._socket.read(1024);
        while(data !== null && data !== undefined) {
            var output = iOSCore.readCString(data, 0);
			var isMatch = regex.match(output);
            if(isMatch !== null) {
                console.log(output);
            }
            data = this._socket.read(1024);
        }
    };

    IOSSyslog.prototype.disconnect = function() {
        if (os.platform() === "win32") {
            this._socket.close();
        } else {
            fs.closeSync(this._service);
        }
    };

    module.exports = new IOSSyslog();

})();
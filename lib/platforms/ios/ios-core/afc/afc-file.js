(function(){
    "use strict";
    var iOSCore = require("./../ios-core"),
        mobileDevice = require("./../../ios-core/mobile-device");

    function AfcFile(afcConnection, path, mode){
        this._afcConnection = afcConnection;
        this._mode = 0;
        if (mode.indexOf("r") > -1) {
            this._mode = 0x1;
        }
        if (mode.indexOf("w") > -1) {
            this._mode = 0x2;
        }
        var afcFileRef = iOSCore.alloc(iOSCore.AFCFileRef);
        this._open = false;

        var result = mobileDevice.functions.AFCFileRefOpen(this._afcConnection, path, this._mode, 0, afcFileRef);
        if (result !== 0) {
            throw "Unable to open file reference: " + result + "path is: " + path;
        }

        this._afcFile = iOSCore.deref(afcFileRef);
        if (this._afcFile === 0) {
            throw  "Invalid file: " + 0;
        }

        this._open = true;
    }

    AfcFile.prototype.close = function() {
        if (this._open) {
            var result = mobileDevice.functions.AFCFileRefClose(this._afcConnection, this._afcFile);
            if (result !== 0) {
                throw "Unable to close afc file connection: " + result;
            }
            this._open = false;
        }
    };

    AfcFile.prototype.write = function(buffer, byteLength) {
        var result = mobileDevice.functions.AFCFileRefWrite(this._afcConnection, this._afcFile, buffer, byteLength);
        if (result !== 0) {
            throw "Unable to write to file: " + result;
        }
    };

    module.exports = AfcFile;

})();
///<reference path="../../../.d.ts"/>

(function() {
    "use strict";
    var iOSCore = require("./ios-core"),
        ffi = require("ffi"),
		path = require("path");

    function WinSocketWrapper(socket) {
        this._socket = socket;
    }

	var winSocketDll = path.join(process.env.SystemRoot, "System32", "ws2_32.dll");
    var winSocketLibrary = ffi.Library(winSocketDll, {
        "closesocket": ["int", ["uint"]],
        "recv": ["int", ["uint", iOSCore.charPtr, "int", "int"]],
        "send": ["int", ["uint", "string", "int", "int"]],
        "setsockopt": ["int", ["uint", "int", "int", iOSCore.voidPtr, "int"]]
    });

    WinSocketWrapper.prototype.read = function(bytes) {
        var data = new Buffer(bytes);
        var result = winSocketLibrary.recv(this._socket, data, bytes, 0);
        if(result < 0) {
            throw "Error receiving data: " + result;
        }

        return data;
    };

    WinSocketWrapper.prototype.write = function(data) {
        return winSocketLibrary.send(this._socket, data, data.length, 0);
    };

    WinSocketWrapper.prototype.close = function() {
        winSocketLibrary.closesocket(this._socket);
        this._socket = null;
    };

    module.exports = WinSocketWrapper;

})();
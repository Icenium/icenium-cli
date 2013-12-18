(function() {
	"use strict";
	var plistlib = require("plistlib"),
		struct = require("bufferpack"),
        WinSocketWrapper = require("./win-socket-wrapper");

	function PlistService(iOSDevice, serviceName) {
		this._service = iOSDevice.startService(serviceName);
		this._socket = new WinSocketWrapper(this._service);
	}

	PlistService.prototype.receiveMessage = function() {
		var data = this._socket.read(4);
		var reply = "";

		if (data !== null && data.length === 4) {
			var l = struct.unpack(">i", data)[0];
			var left = l;
			while (left > 0) {
				var r = this._socket.read(left);
				if (r === null) {
					throw "Unable to read reply";
				}
				reply += r;
				left -= r.length;
			}
		}

		return reply;
	};

	PlistService.prototype.sendMessage = function(data) {
		var payload = plistlib.toString(data);
		var message = struct.pack(">i", [payload.length]) + payload;
		this._socket.write(message);
	};

	PlistService.prototype.disconnect = function() {
		this._socket.close();
	};

    module.exports = PlistService;

})();
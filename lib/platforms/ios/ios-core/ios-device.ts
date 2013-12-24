///<reference path="../../../.d.ts"/>

(function() {
	"use strict";
	var coreFoundation = require("./core-foundation"),
		mobileDevice = require("./../ios-core/mobile-device"),
		iOSCore = require("./../ios-core/ios-core"),
		WinSocketWrapper = require("./win-socket-wrapper"),
		fs = require("fs"),
		os = require("os");

    function IOSDevice(dev) {
		Object.defineProperty(this, "device", {
			get: function() {
				return dev;
			}
		});
		Object.defineProperty(this, "deviceId", {
			get: function() {
				return coreFoundation.convertCFStringToCString(mobileDevice.functions.AMDeviceCopyDeviceIdentifier(this.device));
			}
		});
    }

    function runtimeError(message, errorCode) {
        throw message + " " + errorCode;
    }

    IOSDevice.prototype.isPaired = function() {
        return mobileDevice.functions.AMDeviceIsPaired(this.device) !== 0;
    };

    IOSDevice.prototype.pair = function() {
        var result = mobileDevice.functions.AMDevicePair(this.device);
        if (result !== 0) {
            runtimeError("If your phone is locked with a passcode, unlock then reconnect it", result);
        }
    };

    IOSDevice.prototype.validatePairing = function() {
        var result = mobileDevice.functions.AMDeviceValidatePairing(this.device);
        if (result !== 0) {
            runtimeError("Unable to validate pairing", result);
        }
    };

    IOSDevice.prototype.connect = function() {
        var result = mobileDevice.functions.AMDeviceConnect(this.device);
        if (result !== 0) {
            runtimeError("Unable to connect to device", result);
        }

        if (!this.isPaired()) {
            this.pair();
        }

        this.validatePairing();
    };

    IOSDevice.prototype.disconnect = function() {
        var result = mobileDevice.functions.AMDeviceDisconnect(this.device);
        if (result !== 0) {
            runtimeError("Unable to disconnect from device", result);
        }
    };

    IOSDevice.prototype.startSession = function() {
        var result = mobileDevice.functions.AMDeviceStartSession(this.device);
        if (result !== 0) {
            runtimeError("Unable to start session", result);
        }
    };

    IOSDevice.prototype.stopSession = function() {
        var result = mobileDevice.functions.AMDeviceStopSession(this.device);
        if (result !== 0) {
            runtimeError("Unable to stop session", result);
        }
    };

    IOSDevice.prototype.startService = function(service) {
        this.connect();
        try {
            this.startSession();
            try {
                var socket = iOSCore.alloc("int");
                var result = mobileDevice.functions.AMDeviceStartService(this.device, coreFoundation.createCFString(service), socket, null);
                if (result !== 0) {
                    runtimeError("Unable to start service", result);
                }
                return iOSCore.deref(socket);
            } finally {
                this.stopSession();
            }
        } finally {
            this.disconnect();
        }
    };

    IOSDevice.prototype.stopService = function(fileDescription) {
        if(os.platform() === "win32") {
            var winSocketWrapper = new WinSocketWrapper(fileDescription);
            winSocketWrapper.close();
        }
        else {
            fs.closeSync(fileDescription);
        }
    };

	IOSDevice.prototype.getProductVersion = function() {
		this.connect();
		try {
			return coreFoundation.convertCFStringToCString(mobileDevice.functions.AMDeviceCopyValue(this.device, null, coreFoundation.createCFString("ProductVersion")));
		}
		finally {
			this.disconnect();
		}
	};

	module.exports = IOSDevice;
})();
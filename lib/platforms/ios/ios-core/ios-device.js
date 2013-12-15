(function() {
    "use strict";
    var coreFoundation = require("./core-foundation"),
        mobileDevice = require("./../ios-core/mobile-device"),
        iOSCore = require("./../ios-core/ios-core"),
        WinSocketWrapper = require("./win-socket-wrapper"),
        fs = require("fs"),
        os = require("os"),
        _device = null;

    function IOSDevice(device) {
		_device = device;
    }

    var ADNCI_MSG_CONNECTED = 1,
        ADNCI_MSG_DISCONNECTED = 2,
        ADNCI_MSG_UNKNOWN = 3;

    function runtimeError(message, errorCode) {
        throw message + " " + errorCode;
    }

    function deviceNotificationCallback(deviceInfo) {
        var info = iOSCore.deref(deviceInfo);

        if (info.msg === ADNCI_MSG_CONNECTED) {
            _device = info.dev;
            coreFoundation.functions.CFRunLoopStop(coreFoundation.functions.CFRunLoopGetCurrent());
        } else if (info.msg === ADNCI_MSG_DISCONNECTED) {
            _device = null;
        } else if (info.msg === ADNCI_MSG_UNKNOWN) {
            throw "Unexpected device notification status:" + info.msg;
        }
    }

    function isPaired() {
        return mobileDevice.functions.AMDeviceIsPaired(_device) !== 0;
    }

    function pair() {
        var result = mobileDevice.functions.AMDevicePair(_device);
        if (result !== 0) {
            runtimeError("If your phone is locked with a passcode, unlock then reconnect it", result);
        }
    }

    function validatePairing() {
        var result = mobileDevice.functions.AMDeviceValidatePairing(_device);
        if (result !== 0) {
            runtimeError("Unable to validate pairing", result);
        }
    }

    function connect() {
        var result = mobileDevice.functions.AMDeviceConnect(_device);
        if (result !== 0) {
            runtimeError("Unable to connect to device", result);
        }

        if (!isPaired()) {
            pair();
        }

        validatePairing();
    }

    function disconnect() {
        var result = mobileDevice.functions.AMDeviceDisconnect(_device);
        if (result !== 0) {
            runtimeError("Unable to disconnect from device", result);
        }
    }

    function startSession() {
        var result = mobileDevice.functions.AMDeviceStartSession(_device);
        if (result !== 0) {
            runtimeError("Unable to start session", result);
        }
    }

    function stopSession() {
        var result = mobileDevice.functions.AMDeviceStopSession(_device);
        if (result !== 0) {
            runtimeError("Unable to stop session", result);
        }
    }

    IOSDevice.prototype.startService = function(service) {
        connect();
        try {
            startSession();
            try {
                var socket = iOSCore.alloc("int");
                var result = mobileDevice.functions.AMDeviceStartService(_device, coreFoundation.createCFString(service), socket, null);
                if (result !== 0) {
                    runtimeError("Unable to start service", result);
                }
                return iOSCore.deref(socket);
            } finally {
                stopSession();
            }
        } finally {
            disconnect();
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

    IOSDevice.prototype.waitForDevice = function() {
        console.log("waiting for device");

        var result = mobileDevice.functions.AMDeviceNotificationSubscribe(iOSCore.am_device_notification_callback.toPointer(deviceNotificationCallback), 0, 0, 0, iOSCore.alloc(iOSCore.voidPtr));
        if(result !== 0) {
            throw "Unable to subscribe for notifications: " + result;
        }

        coreFoundation.functions.CFRunLoopRun();

        console.log("connected to device");
        return _device;
    };

	IOSDevice.prototype.getDeviceId = function() {
		return coreFoundation.convertCFStringToCString(mobileDevice.functions.AMDeviceCopyDeviceIdentifier(_device));
	};

	IOSDevice.prototype.getDevice = function() {
		return _device;
	};

    module.exports = new IOSDevice();
})();
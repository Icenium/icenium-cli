(function(){
	"use strict";

	var coreFoundation = require("./../ios-core/core-foundation"),
        mobileDevice = require("./../ios-core/mobile-device"),
		iOSCore = require("./../ios-core/ios-core"),
		IOSDevice = require("./ios-device"),
		devices = [],
		ADNCI_MSG_CONNECTED = 1;

	function IOSDevicesService() {

	}

	function deviceNotificationSubscribe(deviceInfo) {
		var info = iOSCore.deref(deviceInfo);
		if(info.msg === ADNCI_MSG_CONNECTED) {
			var iOSDevice = new IOSDevice(info.dev);
			var deviceId = iOSDevice.getDeviceId();
			console.log(deviceId);
			devices.push(deviceId);
		}
	}

    // function timerCallback() {
    //     coreFoundation.functions.CFRunLoopStop(coreFoundation.functions.CFRunLoopGetCurrent());
    // }

	IOSDevicesService.prototype.listDevices = function() {

		// var timeout = waittime === undefined ? 0.1 : waittime;

		var notify = iOSCore.alloc(iOSCore.AMDeviceNotificationRef);
		var notifyFunc = iOSCore.am_device_notification_callback.toPointer(deviceNotificationSubscribe);

		var result = mobileDevice.functions.AMDeviceNotificationSubscribe(notifyFunc, 0, 0, 0, notify);
		if(result !== 0) {
			throw "Unable to subscribe for notifications";
		}

//		if(timeout > 0) {
//			var timer = coreFoundation.functions.CFRunLoopTimerCreate(null, coreFoundation.functions.CFAbsoluteTimeGetCurrent() + timeout, 0, 0, 0, iOSCore.cf_run_loop_timer_callback.toPointer(timerCallback), null);
//            coreFoundation.functions.CFRunLoopAddTimer(coreFoundation.functions.CFRunLoopGetCurrent(), timer, coreFoundation.functions.kCFRunLoopCommonModes);
//		}

        coreFoundation.functions.CFRunLoopRun();
//        coreFoundation.functions.CFRunLoopStop(coreFoundation.functions.CFRunLoopGetCurrent());

//        if(timeout > 0) {
//            coreFoundation.functions.CFRunLoopRemoveTimer(coreFoundation.functions.CFRunLoopGetCurrent(), timer, coreFoundation.functions.kCFRunLoopCommonModes);
//        }

		return devices;
	};

	module.exports = new IOSDevicesService();
})();
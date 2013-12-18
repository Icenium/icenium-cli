(function(){
	"use strict";

	var coreFoundation = require("./../ios-core/core-foundation"),
        mobileDevice = require("./../ios-core/mobile-device"),
		iOSCore = require("./../ios-core/ios-core"),
		IOSDevice = require("./ios-device"),
		helpers = require("./../../../helpers"),
		log = require("./../../../log"),
		timers = require("timers"),
		_ = require("underscore"),
		devices = [],
		ADNCI_MSG_CONNECTED = 1,
		ADNCI_MSG_DISCONNECTED = 2,
		ADNCI_MSG_UNKNOWN = 3;

	function IOSDevicesService() {

	}

	function getDeviceId(device) {
		return coreFoundation.convertCFStringToCString(mobileDevice.functions.AMDeviceCopyDeviceIdentifier(device));
	}

	function deviceNotificationCallback(deviceInfo) {
		var info = iOSCore.deref(deviceInfo);

		var isDeviceFound = _.find(devices, function(device){
			return device.deviceId === getDeviceId(info.dev);
		});

		if(info.msg !== ADNCI_MSG_CONNECTED || !isDeviceFound || isDeviceFound === undefined) {
			if(info.msg === ADNCI_MSG_CONNECTED) {
				var iOSDevice = new IOSDevice(info.dev);
				devices.push(iOSDevice);
				log.trace("connected to device with id '%s'", iOSDevice.deviceId);
			} else if(info.msg === ADNCI_MSG_DISCONNECTED) {
				var currentDeviceId = getDeviceId(info.dev);
				devices = _.filter(devices, function(device){
					return device.deviceId !== currentDeviceId;
				});
				log.trace("disconnected from device with id '%s'", currentDeviceId);
			} else if(info.msg === ADNCI_MSG_UNKNOWN) {
				helpers.abort("Unexpected device notification status: '%s'", info.msg);
			}
		}
	}

	function timerCallback() {
		coreFoundation.functions.CFRunLoopStop(coreFoundation.functions.CFRunLoopGetCurrent());
	}

	IOSDevicesService.prototype.subscribeForNotifications = function() {
		var notify = iOSCore.alloc(iOSCore.AMDeviceNotificationRef);
		var notifyFunc = iOSCore.am_device_notification_callback.toPointer(deviceNotificationCallback);

		var result = mobileDevice.functions.AMDeviceNotificationSubscribe(notifyFunc, 0, 0, 0, notify);
		if(result !== 0) {
			helpers.abort("Unable to subscribe for notifications");
		}
	};

	IOSDevicesService.prototype.startRunLoopWithTimer = function(timeout) {
		var kCFRunLoopCommonModes = coreFoundation.functions.kCFRunLoopCommonModes.deref(),
			timer = null;

		if(timeout > 0) {
			timer = coreFoundation.functions.CFRunLoopTimerCreate(null, coreFoundation.functions.CFAbsoluteTimeGetCurrent() + timeout, 0, 0, 0, iOSCore.cf_run_loop_timer_callback.toPointer(timerCallback), null);
			coreFoundation.functions.CFRunLoopAddTimer(coreFoundation.functions.CFRunLoopGetCurrent(), timer, kCFRunLoopCommonModes);
		}

		coreFoundation.functions.CFRunLoopRun();

		if(timeout > 0) {
			coreFoundation.functions.CFRunLoopRemoveTimer(coreFoundation.functions.CFRunLoopGetCurrent(), timer, kCFRunLoopCommonModes);
		}
	};

	IOSDevicesService.prototype.startListeningForDevices = function() {
		var timeout = 4;
		this.subscribeForNotifications();
		timers.setTimeout(this.startRunLoopWithTimer(timeout), timeout*1000);
	};

	IOSDevicesService.prototype.getAllDevices = function() {
		return devices;
	};

	module.exports = new IOSDevicesService();
})();
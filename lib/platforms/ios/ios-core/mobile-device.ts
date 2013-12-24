///<reference path="../../../.d.ts"/>

(function() {
    "use strict";
    var ffi = require("ffi"),
        iOSCore = require("./ios-core"),
		path = require("path"),
		iTunesInstallationInfo = require("./iTunes-installation-info");

	function MobileDevice() {
    }

	var appleFolderLocation = iTunesInstallationInfo.getAppleFolderLocation(),
		mobileDeviceDir = path.join(appleFolderLocation, "Mobile Device Support"),
		mobileDeviceDll = path.join(mobileDeviceDir, "MobileDevice.dll");
    process.env.PATH += ";" + mobileDeviceDir;

    MobileDevice.prototype.functions = ffi.Library(mobileDeviceDll, {
        "AMDeviceNotificationSubscribe": ["uint", [iOSCore.am_device_notification_callback, "uint", "uint", "uint", iOSCore.ptrToVoidPtr]],
        "AMDeviceConnect": ["uint", [iOSCore.am_device_p]],
        "AMDeviceIsPaired": ["uint", [iOSCore.am_device_p]],
        "AMDevicePair": ["uint", [iOSCore.am_device_p]],
        "AMDeviceValidatePairing": ["uint", [iOSCore.am_device_p]],
        "AMDeviceStartSession": ["uint", [iOSCore.am_device_p]],
        "AMDeviceStopSession": ["uint", [iOSCore.am_device_p]],
        "AMDeviceDisconnect": ["uint", [iOSCore.am_device_p]],
        "AMDeviceStartService": ["uint", [iOSCore.am_device_p, iOSCore.CFStringRef, iOSCore.intPtr, iOSCore.voidPtr]],
        "AMDeviceTransferApplication": ["uint", ["int", iOSCore.CFStringRef, iOSCore.CFDictionaryRef, iOSCore.am_device_install_application_callback, iOSCore.voidPtr]],
        "AMDeviceInstallApplication": ["uint", ["int", iOSCore.CFStringRef, iOSCore.CFDictionaryRef, iOSCore.am_device_install_application_callback, iOSCore.voidPtr]],
        "AMDeviceLookupApplications": ["uint", [iOSCore.am_device_p, "uint", iOSCore.createPointerFrom(iOSCore.CFDictionaryRef)]],
        "AMDeviceUninstallApplication": ["uint", ["int", iOSCore.CFStringRef, iOSCore.CFDictionaryRef, iOSCore.am_device_install_application_callback, iOSCore.voidPtr]],
        "AFCConnectionOpen": ["uint", ["int", "uint", iOSCore.createPointerFrom(iOSCore.AFCConnectionRef)]],
        "AFCConnectionClose": ["uint", [iOSCore.AFCConnectionRef]],
        "AFCDirectoryCreate": ["uint", [iOSCore.AFCConnectionRef, "string"]],
        "AFCFileRefOpen": ["uint", [iOSCore.AFCConnectionRef, "string", "uint", "uint", iOSCore.createPointerFrom(iOSCore.AFCFileRef)]],
        "AFCFileRefClose": ["uint", [iOSCore.AFCConnectionRef, iOSCore.AFCFileRef]],
        "AFCFileRefWrite": ["uint", [iOSCore.AFCConnectionRef, iOSCore.AFCFileRef, iOSCore.voidPtr, "uint"]],
        "AFCFileRefRead": ["uint", [iOSCore.AFCConnectionRef, iOSCore.AFCFileRef, iOSCore.voidPtr, iOSCore.uintPtr]],
        "AFCDirectoryOpen": [iOSCore.AFCError, [iOSCore.AFCConnectionRef, "string", iOSCore.createPointerFrom(iOSCore.AFCDirectoryRef)]],
        "AFCDirectoryRead": [iOSCore.AFCError, [iOSCore.AFCConnectionRef, iOSCore.AFCDirectoryRef, iOSCore.createPointerFrom(iOSCore.charPtr)]],
        "AFCDirectoryClose": [iOSCore.AFCError, [iOSCore.AFCConnectionRef, iOSCore.AFCDirectoryRef]],
		"AMDeviceCopyDeviceIdentifier": [iOSCore.CFStringRef, [iOSCore.am_device_p]],
		"AMDeviceCopyValue": [iOSCore.CFStringRef, [iOSCore.am_device_p, iOSCore.CFStringRef, iOSCore.CFStringRef]],
//		"AMDeviceGetName": [iOSCore.CFStringRef, [iOSCore.AMDeviceRef]],
		"AMDeviceNotificationUnsubscribe": [iOSCore.intType, [iOSCore.AMDeviceNotificationRef]]
    });

    module.exports = new MobileDevice();

})();
///<reference path="../../../.d.ts"/>

(function() {
    "use strict";
    var iOSCore = require("./ios-core"),
        ffi = require("ffi"),
        struct = require("ref-struct"),
		path = require("path"),
		iTunesInstallationInfo = require("./iTunes-installation-info");

    var kCFStringEncodingUTF8 = 0x08000100;

    function CoreFoundation() {
    }

	var appleFolderLocation = iTunesInstallationInfo.getAppleFolderLocation(),
		coreFoundationDir = path.join(appleFolderLocation, "Apple Application Support"),
		coreFoundationDll = path.join(coreFoundationDir, "CoreFoundation.dll");
	process.env.PATH = coreFoundationDir + ";" + process.env.PATH;

	var CFDictionaryKeyCallBacks = struct({
        version: iOSCore.uintType,
        retain: iOSCore.voidPtr,
        release: iOSCore.voidPtr,
        copyDescription: iOSCore.voidPtr,
        equal: iOSCore.voidPtr,
        hash: iOSCore.voidPtr
    });

    var CFDictionaryValueCallBacks = struct({
        version: iOSCore.uintType,
        retain: iOSCore.voidPtr,
        release: iOSCore.voidPtr,
        copyDescription: iOSCore.voidPtr,
        equal: iOSCore.voidPtr
    });

    CoreFoundation.prototype.functions = ffi.Library(coreFoundationDll, {
        "CFRunLoopRun": ["void", []],
        "CFRunLoopStop": ["void", [iOSCore.voidPtr]],
        "CFRunLoopGetCurrent": [iOSCore.voidPtr, []],
        "CFStringCreateWithCString": [iOSCore.CFStringRef, [iOSCore.voidPtr, "string", "uint"]],
        "CFDictionaryGetValue": [iOSCore.voidPtr, [iOSCore.CFDictionaryRef, iOSCore.CFStringRef]],
        "CFNumberGetValue": [iOSCore.boolType, [iOSCore.voidPtr, "uint", iOSCore.voidPtr]],
        "CFStringGetCStringPtr": [iOSCore.charPtr, [iOSCore.CFStringRef, "uint"]],
        "CFStringGetCString": [iOSCore.boolType, [iOSCore.CFStringRef, iOSCore.charPtr, "uint", "uint"]],
        "CFStringGetLength": ["ulong", [iOSCore.CFStringRef]],
        "CFDictionaryGetCount": ["int", [iOSCore.CFDictionaryRef]],
        "CFDictionaryGetKeysAndValues": ["void", [iOSCore.CFDictionaryRef, iOSCore.ptrToVoidPtr, iOSCore.ptrToVoidPtr]],
        "CFDictionaryCreate": [iOSCore.CFDictionaryRef, [iOSCore.voidPtr, iOSCore.ptrToVoidPtr, iOSCore.ptrToVoidPtr, "int", iOSCore.createPointerFrom(CFDictionaryKeyCallBacks), iOSCore.createPointerFrom(CFDictionaryValueCallBacks)]],
        "kCFTypeDictionaryKeyCallBacks": [CFDictionaryKeyCallBacks],
        "kCFTypeDictionaryValueCallBacks": [CFDictionaryValueCallBacks],
		"CFRunLoopRunInMode": [iOSCore.intType, [iOSCore.CFStringRef, iOSCore.CFTimeInterval, iOSCore.boolType]],
		"kCFRunLoopDefaultMode": [iOSCore.voidPtr],
        "kCFRunLoopCommonModes": [iOSCore.voidPtr],
		"CFRunLoopTimerCreate": [iOSCore.voidPtr, [iOSCore.voidPtr, iOSCore.doubleType, iOSCore.doubleType, iOSCore.uintType, iOSCore.uintType, iOSCore.cf_run_loop_timer_callback, iOSCore.voidPtr]],
		"CFRunLoopAddTimer": ["void", [iOSCore.voidPtr, iOSCore.voidPtr, iOSCore.CFStringRef]],
		"CFRunLoopRemoveTimer": ["void", [iOSCore.voidPtr, iOSCore.voidPtr, iOSCore.CFStringRef]],
        "CFAbsoluteTimeGetCurrent": [iOSCore.doubleType, []]
//        "CFPropertyListCreateData": [CFDataRef, [CFAllocatorRef, CFPropertyListRef, CFPropertyListFormat, CFOptionFlags, ref.refType(CFErrorRef)]]
    });

    CoreFoundation.prototype.createCFString = function(value) {
        var result = this.functions.CFStringCreateWithCString(null, value, kCFStringEncodingUTF8);
        return result;
    };

    CoreFoundation.prototype.convertCFStringToCString = function(cfstr) {
        var result = null;
        if (cfstr != null) {
            result = this.functions.CFStringGetCStringPtr(cfstr, kCFStringEncodingUTF8);
            if (iOSCore.address(result) === 0) {
                var cfstrLength = this.functions.CFStringGetLength(cfstr);
                var length = cfstrLength + 1;
                var stringBuffer = new Buffer(length);
                var status = this.functions.CFStringGetCString(cfstr, stringBuffer, length, kCFStringEncodingUTF8);
                if (status) {
                    result = stringBuffer.toString("utf8", 0, cfstrLength);
                } else {
                    throw "Unable to convert string: " + result;
                }
            } else {
                result = iOSCore.readCString(result, 0);
            }
        }

        return result;
    };

    module.exports = new CoreFoundation();
})();
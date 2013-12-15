(function() {
    "use strict";
    var ffi = require("ffi"),
        ref = require("ref"),
        struct = require("ref-struct");

    var pointerSize = ref.sizeof.pointer;
    var voidPtr = ref.refType(ref.types.void);
    var CFDictionaryRef = voidPtr;

    exports.pointerSize = pointerSize;
    exports.voidPtr = voidPtr;
    exports.intPtr = ref.refType(ref.types.int);
    exports.uintPtr = ref.refType(ref.types.uint);
    exports.charPtr = ref.refType(ref.types.char);
    exports.ptrToVoidPtr = ref.refType(ref.refType(ref.types.void));
    exports.uintType = ref.types.uint;
    exports.intType = ref.types.int;
    exports.boolType = ref.types.bool;
    exports.doubleType = ref.types.double;

    exports.CFDataRef = voidPtr;
    exports.CFStringRef = voidPtr;
    exports.CFDictionaryRef = CFDictionaryRef;
    exports.AFCConnectionRef = voidPtr;
    exports.AFCFileRef = ref.types.uint64;
    exports.AFCDirectoryRef = voidPtr;
    exports.AFCError = ref.types.uint32;
	exports.AMDeviceRef = voidPtr;
	exports.AMDeviceNotificationRef = voidPtr;
	exports.CFTimeInterval = ref.types.double;

    var am_device_p = ref.refType(ref.types.void);
    exports.am_device_p = am_device_p;

    var am_device_notification_callback_info = struct({
        dev: am_device_p,
        msg: ref.types.uint
    });

    exports.am_device_notification_callback = ffi.Function("void", [ref.refType(am_device_notification_callback_info), "int"]);
    exports.am_device_install_application_callback = ffi.Function("void", [CFDictionaryRef, voidPtr]);
    exports.cf_run_loop_timer_callback = ffi.Function("void", [voidPtr, voidPtr]);

    exports.alloc = function(type, value) {
        if(value === undefined) {
            return ref.alloc(type);
        }
        else {
            return ref.alloc(type, value);
        }
    };

    exports.deref = function(value) {
        return ref.deref(value);
    };

    exports.createPointerFrom = function(type) {
        return ref.refType(type);
    };

    exports.address = function(value) {
        return ref.address(value);
    };

    exports.readCString = function(value, startIndex) {
        return ref.readCString(value, startIndex);
    };

})();
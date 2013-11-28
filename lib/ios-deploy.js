(function() {
    "use strict";
	var ffi = require('ffi'),
	    ref = require('ref'),
        Struct = require('ref-struct'),
		osPath = require('path'),
		os = require('os'),
		fs = require('fs'),
		net = require('net');

    var intPtr = ref.refType(ref.types.int),
		uintPtr = ref.refType(ref.types.uint),
		voidPtr = ref.refType(ref.types.void),
		charPtr = ref.refType(ref.types.char),
		ptrToVoidPtr = ref.refType(ref.refType(ref.types.void)),
 		POINTER_SIZE = ref.sizeof.pointer;

 	var ADNCI_MSG_CONNECTED = 1,
		ADNCI_MSG_DISCONNECTED = 2,
		ADNCI_MSG_UNKNOWN = 3,
		kCFStringEncodingUTF8 = 0x08000100,
		kCFNumberSInt32Type = 3;

 	var _device = null,
		am_device_p = voidPtr,
		CFStringRef = voidPtr,
		CFDictionaryRef = voidPtr,
		AFCConnectionRef = voidPtr,
		AFCFileRef = ref.types.uint64;

	function runtimeError(message, errorCode) {
		throw message;
	}

	function isWin64() { 
		return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
	}

	function getAppleFolderLocation() {
		var appleFolderLocation = "";
		if(isWin64()) {
			if(POINTER_SIZE == 4) {
				appleFolderLocation = 'C:\\Program Files (x86)\\Common Files\\Apple\\';
			}
			else if(POINTER_SIZE == 8) {
				appleFolderLocation = "C:\\Program Files\\Common Files\\Apple\\";
			}
		}
		else {
			appleFolderLocation = "C:\\Program Files\\Common Files\\Apple\\";
		}

		return appleFolderLocation;
	}

	var coreFoundationDir = getAppleFolderLocation() + "Apple Application Support\\";
	var mobileDeviceDir = getAppleFolderLocation() + "Mobile Device Support\\";

	if(!osPath.existsSync(coreFoundationDir)) {
		runtimeError("Cannot find CoreFoundation directory: " + coreFoundationDir);
	}

	if(!osPath.existsSync(mobileDeviceDir)) {
		runtimeError("Cannot find MobileDevice directory: " + mobileDeviceDir);
	}

	process.env.PATH = coreFoundationDir + ";" + process.env.PATH;
	process.env.PATH += ';' + mobileDeviceDir;

	var CFDictionaryKeyCallBacks = Struct({
		version: ref.types.uint,
	    retain: voidPtr,
	    release: voidPtr,
	    copyDescription: voidPtr,
	    equal: voidPtr,
	    hash: voidPtr,
	});

	var CFDictionaryValueCallBacks = Struct({
	    version: ref.types.uint,
	    retain: voidPtr,
	    release: voidPtr,
	    copyDescription: voidPtr,
	    equal: voidPtr,
	});

	var am_device_notification_callback_info = Struct({
		dev: am_device_p,
	   	msg: ref.types.uint,
	});

	var am_device_notification_callback = ffi.Function('void', [ref.refType(am_device_notification_callback_info), 'int']);
	var am_device_install_application_callback = ffi.Function('void', [CFDictionaryRef, voidPtr]);

	var coreFoundation = ffi.Library(coreFoundationDir + 'CoreFoundation.dll', {
		'CFGetTypeID': ['ulong', [voidPtr]],
		'CFStringGetTypeID': ['ulong', []],
		'CFDictionaryGetTypeID': ['ulong', []],
		'CFCopyDescription': [CFStringRef, [voidPtr]],
		'CFRunLoopStop': ['void', [voidPtr]],
		'CFRunLoopGetCurrent': [voidPtr, []],
		'CFRunLoopRun': ['void', []],
		'CFStringCreateWithCString': [CFStringRef, [voidPtr, 'string', 'uint']],
		'CFDictionaryGetValue': [voidPtr, [CFDictionaryRef, CFStringRef]],
		'CFNumberGetValue': [ref.types.bool, [voidPtr, 'uint', voidPtr]],
		'CFStringGetCStringPtr': [charPtr, [CFStringRef, 'uint']],
		'CFStringGetCString': [ref.types.bool, [CFStringRef, charPtr, 'uint', 'uint']],
		'CFStringGetLength': ['ulong', [CFStringRef]],
		'CFDictionaryGetCount': ['int', [CFDictionaryRef]],
		'CFDictionaryGetKeysAndValues': ['void', [CFDictionaryRef, ptrToVoidPtr, ptrToVoidPtr]],
		'CFDictionaryCreate': [CFDictionaryRef, [voidPtr, ptrToVoidPtr, ptrToVoidPtr, 'int', ref.refType(CFDictionaryKeyCallBacks), ref.refType(CFDictionaryValueCallBacks)]],
		'kCFTypeDictionaryKeyCallBacks': [CFDictionaryKeyCallBacks],
		'kCFTypeDictionaryValueCallBacks': [CFDictionaryValueCallBacks],
	});

	var mobileDevice = ffi.Library(mobileDeviceDir + 'MobileDevice.dll', {
		'AMDeviceNotificationSubscribe': ['uint', [am_device_notification_callback, 'uint', 'uint', 'uint', ptrToVoidPtr]],
		'AMDeviceConnect': ['uint', [am_device_p]],
		'AMDeviceIsPaired': ['uint', [am_device_p]],
		'AMDevicePair': ['uint', [am_device_p]],
		'AMDeviceValidatePairing': ['uint', [am_device_p]],
		'AMDeviceStartSession': ['uint', [am_device_p]],
		'AMDeviceStopSession': ['uint', [am_device_p]],
		'AMDeviceDisconnect': ['uint', [am_device_p]],
		'AMDeviceStartService': ['uint', [am_device_p, CFStringRef, intPtr, voidPtr]],	
		'AMDeviceTransferApplication': ['uint', ['int', CFStringRef, CFDictionaryRef, am_device_install_application_callback, voidPtr]],
		'AMDeviceInstallApplication': ['uint', ['int', CFStringRef, CFDictionaryRef, am_device_install_application_callback, voidPtr]],
		'AMDeviceLookupApplications': ['uint', [am_device_p, 'uint', ref.refType(CFDictionaryRef)]],
		'AMDeviceUninstallApplication': ['uint', ['int', CFStringRef, CFDictionaryRef, am_device_install_application_callback, voidPtr]],
		'AFCConnectionOpen': ['uint', ['int', 'uint', ref.refType(AFCConnectionRef)]],
		'AFCConnectionClose': ['uint', [AFCConnectionRef]],
		'AFCDirectoryCreate': ['uint', [AFCConnectionRef, 'string']],
		'AFCFileRefOpen': ['uint', [AFCConnectionRef, 'string', 'uint', 'uint', ref.refType(AFCFileRef)]],
		'AFCFileRefClose': ['uint', [AFCConnectionRef, AFCFileRef]],
		'AFCFileRefWrite': ['uint', [AFCConnectionRef, AFCFileRef, voidPtr, 'uint']],
		'AFCFileRefRead': ['uint', [AFCConnectionRef, AFCFileRef, voidPtr, uintPtr]],
	});

	function showStatus(action, dictionary) {
		var show = action;

		var percentComplete = coreFoundation.CFDictionaryGetValue(dictionary, createCFString('PercentComplete'));
		if(ref.address(percentComplete) != 0) {
			var percent = ref.alloc(ref.types.int);
			coreFoundation.CFNumberGetValue(percentComplete, kCFNumberSInt32Type, percent);
			show += " " + percent.deref();
		}

		show += " " + convertCFStringToCString(coreFoundation.CFDictionaryGetValue(dictionary, createCFString('Status')));

		var path = coreFoundation.CFDictionaryGetValue(dictionary, createCFString('Path'));
		if(ref.address(path) != 0) {
			show += convertCFStringToCString(path);
		}

		console.log(show);
	}

	function deviceNotificationCallback(deviceInfo, user) {
		var info = deviceInfo.deref();

		if(info.msg == ADNCI_MSG_CONNECTED) {
	       _device = info.dev;
	       coreFoundation.CFRunLoopStop(coreFoundation.CFRunLoopGetCurrent());
	   }
	   else if(info.msg == ADNCI_MSG_DISCONNECTED) {
	   		_device = null;
	   }
	   else if(info.msg == ADNCI_MSG_UNKNOWN) {
	        // # This happens as we're closing.
	    }
	    else {
	    	runtimeError('Unexpected device notification status', info.msg);
	    }
	}

	function transferCallback(dictionary, user) {
		showStatus('Transferring', dictionary);
	}

	function installCallback(dictionary, user) {
		showStatus('Installing', dictionary);
	}

	function uninstallCallback(dictionary, user) {
		showStatus('Uninstalling', dictionary);
	}

	function isPaired() {
		return mobileDevice.AMDeviceIsPaired(_device) != 0;
	}

	function pair() {
		var result = mobileDevice.AMDevicePair(_device);
		if(result != 0) {
			runtimeError("If your phone is locked with a passcode, unlock then reconnect it", result);
		}
	}

	function validatePairing() {
		var result = mobileDevice.AMDeviceValidatePairing(_device);
		if(result != 0) {
			runtimeError("Unable to validate pairing", result);
		} 
	}

	function connect() {
		var result = mobileDevice.AMDeviceConnect(_device);
		if(result != 0) {
			runtimeError("Unable to connect to device", result);
		}

		if(!isPaired()) {
			pair();
		}

		validatePairing();
	}

	function disconnect () {
		var result = mobileDevice.AMDeviceDisconnect(_device);
		if(result != 0) {
			runtimeError("Unable to disconnect from device", result);
		}
	}

	function startSession() {
		var result = mobileDevice.AMDeviceStartSession(_device);
		if(result != 0) {
			runtimeError("Unable to start session", result);
		}
	}

	function stopSession() {
		var result = mobileDevice.AMDeviceStopSession(_device);
		if(result != 0) {
			runtimeError("Unable to stop session", result);
		}
	}

	function startService(service) {
		connect();
		try {
			startSession();
			try {
				var fd = ref.alloc('int');
				var result = mobileDevice.AMDeviceStartService(_device, createCFString(service), fd, null);
				if(result != 0) {
					runtimeError("Unable to start service", result);
				}
				return fd.deref();
				}
			finally {
				stopSession();
			}
		}
		finally{
			disconnect();
		}
	}

	function stopService(fd) {
		if(os.platform() == 'win32') {
			var socket = new net.Socket();
		 	socket.connect(fd);
		 	socket.destroy();
		}
		else {
			fs.closeSync(fd);
		}
	} 

	function createCFString(value) {
		var result = coreFoundation.CFStringCreateWithCString(null, value, kCFStringEncodingUTF8);
		return result;
	}

	function convertCFStringToCString(cfstr) {
		var result = null;
		if(cfstr != null) {
			result = coreFoundation.CFStringGetCStringPtr(cfstr, kCFStringEncodingUTF8);
			if(ref.address(result) == 0) {
				var cfstrLength = coreFoundation.CFStringGetLength(cfstr);
				var length = cfstrLength + 1;
				var stringBuffer = new Buffer(length);
				var status = coreFoundation.CFStringGetCString(cfstr, stringBuffer, length, kCFStringEncodingUTF8);
				if(status) {
					result = stringBuffer.toString();
				}
				else {
					runtimeError("Unable to convert string", result);
				}
			} else {
				result = ref.readCString(result, 0);
			}
		}

		return result;
	}

	function waitForDevice() {
		ref.alloc(voidPtr);
		var result = mobileDevice.AMDeviceNotificationSubscribe(am_device_notification_callback.toPointer(deviceNotificationCallback), 0, 0, 0, ref.alloc(voidPtr));
		if(result != 0) {
			runtimeError("Unable to subscribe for notifications", result);
		}

		coreFoundation.CFRunLoopRun();

		return _device;
	}	

	function transferApplication(path) {
		var afc = startService("com.apple.afc");
		var normalizedPath = osPath.normalize(path);
		var resolvedPath = osPath.resolve(normalizedPath);
		try {
			var result = mobileDevice.AMDeviceTransferApplication(afc, createCFString(resolvedPath), null, am_device_install_application_callback.toPointer(transferCallback), null);
			if(result != 0) {
				runtimeError("Unable to transfer application", result);
			}
		}
		finally {
			stopService(afc);
		}
	}

	function installApplication(path) {
		var afc = startService("com.apple.mobile.installation_proxy");
		try {
			var count = 1;
			var keys = ref.alloc(voidPtr, createCFString('PackageType'));
			var values = ref.alloc(voidPtr, createCFString("Developer"));

			var options = coreFoundation.CFDictionaryCreate(null, keys, values, count, coreFoundation.kCFTypeDictionaryKeyCallBacks, coreFoundation.kCFTypeDictionaryValueCallBacks);
			var result = mobileDevice.AMDeviceInstallApplication(afc, createCFString(path), options, am_device_install_application_callback.toPointer(installCallback), null);
			if(result != 0) {
				runtimeError("Unable to install application", result);
			}
		}
		finally{
			stopService(afc);
		}
	}

	function convertToJavascript (dataRef) {
		var typeId = coreFoundation.CFGetTypeID(dataRef);
	    if(typeId == coreFoundation.CFStringGetTypeID()) {
	        return CFStringGetStr(dataRef);
	    }
	    else if(typeId == coreFoundation.CFDictionaryGetTypeID()) {
	        return ConvertCFDictionary(dataRef);
	    }
	    else {
	        description = coreFoundation.CFCopyDescription(dataRef)
	        return CFStringGetStr(description);
	    }
	}

	function convertCFDictionary(dictionary) {
		var count = coreFoundation.CFDictionaryGetCount(dictionary);
		var len = count * POINTER_SIZE;

		var keysBuff = new Buffer(len);
		var valuesBuff = new Buffer(len);

		coreFoundation.CFDictionaryGetKeysAndValues(dictionary, keysBuff, valuesBuff);

		var offset = 0;

		for(var i=0; i < len; i++) {

			var key = ref.readPointer(keysBuff, offset, POINTER_SIZE);
			var value = ref.readPointer(valuesBuff, offset, POINTER_SIZE);

			console.log(convertToJavascript(key));

			offset += POINTER_SIZE;
		}
	}

	function lookupApplications() {
		connect();
		try {
			startSession();
			try {
				var dictionary = ref.alloc(CFDictionaryRef);
				var result = mobileDevice.AMDeviceLookupApplications(_device, 0, dictionary);
				if(result != 0) {
					runtimeError("Unable to lookup applications", result)
				}
				ConvertCFDictionary(dictionary.deref());
			}
			finally {
				stopSession();
			}
		}
		finally {
			disconnect();
		}
	}

	function uninstallApplication(bundleId) {
		var afc = startService("com.apple.mobile.installation_proxy");
		try {
			var result = mobileDevice.AMDeviceUninstallApplication(afc, CFStr(bundleId), null, am_device_install_application_callback.toPointer(uninstallCallback), null);
			if(result != 0) {
				runtimeError("Unable to uninstall application", result);
			}
		}
		finally {
			stopService(afc);
		}
	}

/* ****************************** FileDescription ****************************** */

	function FileDescription(afc, path, mode) {
		this._afc = afc;
		this._mode = 0;
		if(mode.indexOf('r') > -1) {
	        this._mode |= 1;
	 	}
	    if(mode.indexOf('w') > -1) {
	        this._mode |= 2;
	    }
	 	var file = ref.alloc(AFCFileRef);
	 	this._open = false;
	 
	 	var result = mobileDevice.AFCFileRefOpen(this._afc, path, this._mode, 0, file);
	 	if(result != 0) {
	 		runtimeError('Unable to open file reference', result);
	 	}

	 	this._file = file.deref();
	 	if(this._file == 0) {
	 		runtimeError('Invalid file', 0);
	 	}

	 	this._open = true;
	}

	FileDescription.prototype.close = function() {
		if(this._open) {
			var result = mobileDevice.AFCFileRefClose(this._afc, this._file);
			if(result != 0) {
				runtimeError('Unable to close afc file connection', result);
			}
			this._open = false;
		}
	}

	FileDescription.prototype.write = function(buffer, byteLength) {
		var result = mobileDevice.AFCFileRefWrite(this._afc, this._file, buffer, byteLength);
		if(result != 0) {
			runtimeError('Unable to write to file', result);
		}
	}

/* ****************************** FileService ****************************** */ 

	function FileService(session) {
		var afc = ref.alloc(AFCConnectionRef);
		var result = mobileDevice.AFCConnectionOpen(session, 0, afc);
		if(result != 0) {
			runtimeError('Unable to open apple file connection', result);
		}
		this._afc = afc.deref();
	}

	FileService.prototype.open = function(path, mode) {
		return new FileDescription(this._afc, path, mode);
	}

	FileService.prototype.close = function() {
		mobileDevice.AFCConnectionClose(this._afc);
	}

	FileService.prototype.mkdir = function(path) {
		var result = mobileDevice.AFCDirectoryCreate(this._afc, path);
		if(result != 0){
			runtimeError('Unable to make directory', result);
		}
	}

	function deploy(bundle) {

		console.log('Waiting for a device...');
		waitForDevice();
		console.log("Connected to device");

		transferApplication(bundle);
		installApplication(bundle);
	}

	exports.deploy = deploy;

})();
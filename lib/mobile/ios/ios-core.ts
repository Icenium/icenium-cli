///<reference path="./../../.d.ts"/>
"use strict";

import path = require("path");
import ref = require("ref");
import ffi = require("ffi");
import struct = require("ref-struct");
import bufferpack = require("bufferpack");
import plistlib = require("plistlib");
import helpers = require("./../../helpers");

export class CoreTypes {
	public static pointerSize = ref.types.size_t.size;
	public static voidPtr = ref.refType(ref.types.void);
	public static intPtr = ref.refType(ref.types.int);
	public static uintPtr = ref.refType(ref.types.uint);
	public static charPtr = ref.refType(ref.types.char);
	public static ptrToVoidPtr = ref.refType(ref.refType(ref.types.void));
	public static uintType = ref.types.uint;
	public static uint32Type = ref.types.uint32;
	public static intType = ref.types.int;
	public static boolType = ref.types.bool;
	public static doubleType = ref.types.double;

	public static am_device_p = CoreTypes.voidPtr;
	public static cfDictionaryRef = CoreTypes.voidPtr;
	public static cfDataRef = CoreTypes.voidPtr;
	public static cfStringRef = CoreTypes.voidPtr;
	public static afcConnectionRef = CoreTypes.voidPtr;
	public static afcFileRef = ref.types.uint64;
	public static afcDirectoryRef = CoreTypes.voidPtr;
	public static afcError = ref.types.uint32;
	public static amDeviceRef = CoreTypes.voidPtr;
	public static amDeviceNotificationRef = CoreTypes.voidPtr;
	public static cfTimeInterval = ref.types.double;

	public static am_device_notification = struct({
		unknown0: ref.types.uint32,
		unknown1: ref.types.uint32,
		unknown2: ref.types.uint32,
		callback: CoreTypes.voidPtr,
		cookie: ref.types.uint32
	});

	public static am_device_notification_callback_info = struct({
		dev: CoreTypes.am_device_p,
		msg: ref.types.uint,
		subscription: ref.refType(CoreTypes.am_device_notification)
	});

	public static am_device_notification_callback = ffi.Function("void", [ref.refType(CoreTypes.am_device_notification_callback_info), CoreTypes.voidPtr]);
	public static am_device_install_application_callback = ffi.Function("void", [CoreTypes.cfDictionaryRef, CoreTypes.voidPtr]);
	public static cf_run_loop_timer_callback = ffi.Function("void", [CoreTypes.voidPtr, CoreTypes.voidPtr]);
}

export class IOSCore implements Mobile.IiOSCore {

	constructor(private $fs: IFileSystem) {
	}

	private cfDictionaryKeyCallBacks = struct({
		version: CoreTypes.uintType,
		retain: CoreTypes.voidPtr,
		release: CoreTypes.voidPtr,
		copyDescription: CoreTypes.voidPtr,
		equal: CoreTypes.voidPtr,
		hash: CoreTypes.voidPtr
	});

	private cfDictionaryValueCallBacks = struct({
		version: CoreTypes.uintType,
		retain: CoreTypes.voidPtr,
		release: CoreTypes.voidPtr,
		copyDescription: CoreTypes.voidPtr,
		equal: CoreTypes.voidPtr
	});

	public static kCFStringEncodingUTF8 = 0x08000100;

	private appleFolderLocation = new iTunesInstallationInfo(this.$fs).getAppleFolderLocation();
	private coreFoundationDir = path.join(this.appleFolderLocation, "Apple Application Support");
	private coreFoundationDll = path.join(this.coreFoundationDir, "CoreFoundation.dll");
	private mobileDeviceDir = path.join(this.appleFolderLocation, "Mobile Device Support");
	private mobileDeviceDll = path.join(this.mobileDeviceDir, "MobileDevice.dll");

	private setPath() {
		if(helpers.isWindows()) {
			process.env.PATH = this.coreFoundationDir + ";" + process.env.PATH;
			process.env.PATH += ";" + this.mobileDeviceDir;
		}
	}

	public getCoreFoundationLibrary(): { } {
		this.setPath();

		return ffi.Library(this.coreFoundationDll, {
			"CFRunLoopRun": ["void", []],
			"CFRunLoopStop": ["void", [CoreTypes.voidPtr]],
			"CFRunLoopGetCurrent": [CoreTypes.voidPtr, []],
			"CFStringCreateWithCString": [CoreTypes.cfStringRef, [CoreTypes.voidPtr, "string", "uint"]],
			"CFDictionaryGetValue": [CoreTypes.voidPtr, [CoreTypes.cfDictionaryRef, CoreTypes.cfStringRef]],
			"CFNumberGetValue": [CoreTypes.boolType, [CoreTypes.voidPtr, "uint", CoreTypes.voidPtr]],
			"CFStringGetCStringPtr": [CoreTypes.charPtr, [CoreTypes.cfStringRef, "uint"]],
			"CFStringGetCString": [CoreTypes.boolType, [CoreTypes.cfStringRef, CoreTypes.charPtr, "uint", "uint"]],
			"CFStringGetLength": ["ulong", [CoreTypes.cfStringRef]],
			"CFDictionaryGetCount": ["int", [CoreTypes.cfDictionaryRef]],
			"CFDictionaryGetKeysAndValues": ["void", [CoreTypes.cfDictionaryRef, CoreTypes.ptrToVoidPtr, CoreTypes.ptrToVoidPtr]],
			"CFDictionaryCreate": [CoreTypes.cfDictionaryRef, [CoreTypes.voidPtr, CoreTypes.ptrToVoidPtr, CoreTypes.ptrToVoidPtr, "int", ref.refType(this.cfDictionaryKeyCallBacks), ref.refType(this.cfDictionaryValueCallBacks)]],
			"kCFTypeDictionaryKeyCallBacks": [this.cfDictionaryKeyCallBacks],
			"kCFTypeDictionaryValueCallBacks": [this.cfDictionaryValueCallBacks],
			"CFRunLoopRunInMode": [CoreTypes.intType, [CoreTypes.cfStringRef, CoreTypes.cfTimeInterval, CoreTypes.boolType]],
			"kCFRunLoopDefaultMode": [CoreTypes.voidPtr],
			"kCFRunLoopCommonModes": [CoreTypes.voidPtr],
			"CFRunLoopTimerCreate": [CoreTypes.voidPtr, [CoreTypes.voidPtr, CoreTypes.doubleType, CoreTypes.doubleType, CoreTypes.uintType, CoreTypes.uintType, CoreTypes.cf_run_loop_timer_callback, CoreTypes.voidPtr]],
			"CFRunLoopAddTimer": ["void", [CoreTypes.voidPtr, CoreTypes.voidPtr, CoreTypes.cfStringRef]],
			"CFRunLoopRemoveTimer": ["void", [CoreTypes.voidPtr, CoreTypes.voidPtr, CoreTypes.cfStringRef]],
			"CFAbsoluteTimeGetCurrent": [CoreTypes.doubleType, []],
			"CFGetTypeID": ['ulong', [CoreTypes.voidPtr]]
		});
	}

	public getMobileDeviceLibrary(): {[key: string]: any} {
		return ffi.Library(this.mobileDeviceDll, {
			"AMDeviceNotificationSubscribe": ["uint", [CoreTypes.am_device_notification_callback, "uint", "uint", "uint", CoreTypes.ptrToVoidPtr]],
			"AMDeviceConnect": ["uint", [CoreTypes.am_device_p]],
			"AMDeviceIsPaired": ["uint", [CoreTypes.am_device_p]],
			"AMDevicePair": ["uint", [CoreTypes.am_device_p]],
			"AMDeviceValidatePairing": ["uint", [CoreTypes.am_device_p]],
			"AMDeviceStartSession": ["uint", [CoreTypes.am_device_p]],
			"AMDeviceStopSession": ["uint", [CoreTypes.am_device_p]],
			"AMDeviceDisconnect": ["uint", [CoreTypes.am_device_p]],
			"AMDeviceStartService": ["uint", [CoreTypes.am_device_p, CoreTypes.cfStringRef, CoreTypes.intPtr, CoreTypes.voidPtr]],
			"AMDeviceTransferApplication": ["uint", ["int", CoreTypes.cfStringRef, CoreTypes.cfDictionaryRef, CoreTypes.am_device_install_application_callback, CoreTypes.voidPtr]],
			"AMDeviceInstallApplication": ["uint", ["int", CoreTypes.cfStringRef, CoreTypes.cfDictionaryRef, CoreTypes.am_device_install_application_callback, CoreTypes.voidPtr]],
			"AMDeviceLookupApplications": ["uint", [CoreTypes.am_device_p, "uint", ref.refType(CoreTypes.cfDictionaryRef)]],
			"AMDeviceUninstallApplication": ["uint", ["int", CoreTypes.cfStringRef, CoreTypes.cfDictionaryRef, CoreTypes.am_device_install_application_callback, CoreTypes.voidPtr]],
			"AFCConnectionOpen": ["uint", ["int", "uint", ref.refType(CoreTypes.afcConnectionRef)]],
			"AFCConnectionClose": ["uint", [CoreTypes.afcConnectionRef]],
			"AFCDirectoryCreate": ["uint", [CoreTypes.afcConnectionRef, "string"]],
			"AFCFileRefOpen": ["uint", [CoreTypes.afcConnectionRef, "string", "uint", "uint", ref.refType(CoreTypes.afcFileRef)]],
			"AFCFileRefClose": ["uint", [CoreTypes.afcConnectionRef, CoreTypes.afcFileRef]],
			"AFCFileRefWrite": ["uint", [CoreTypes.afcConnectionRef, CoreTypes.afcFileRef, CoreTypes.voidPtr, "uint"]],
			"AFCFileRefRead": ["uint", [CoreTypes.afcConnectionRef, CoreTypes.afcFileRef, CoreTypes.voidPtr, CoreTypes.uintPtr]],
			"AFCDirectoryOpen": [CoreTypes.afcError, [CoreTypes.afcConnectionRef, "string", ref.refType(CoreTypes.afcDirectoryRef)]],
			"AFCDirectoryRead": [CoreTypes.afcError, [CoreTypes.afcConnectionRef, CoreTypes.afcDirectoryRef, ref.refType(CoreTypes.charPtr)]],
			"AFCDirectoryClose": [CoreTypes.afcError, [CoreTypes.afcConnectionRef, CoreTypes.afcDirectoryRef]],
			"AMDeviceCopyDeviceIdentifier": [CoreTypes.cfStringRef, [CoreTypes.am_device_p]],
			"AMDeviceCopyValue": [CoreTypes.cfStringRef, [CoreTypes.am_device_p, CoreTypes.cfStringRef, CoreTypes.cfStringRef]],
			"AMDeviceNotificationUnsubscribe": [CoreTypes.intType, [CoreTypes.amDeviceNotificationRef]]
		});
	}

	public static getWinSocketLibrary(): {[key: string]: any} {
		var winSocketDll = path.join(process.env.SystemRoot, "System32", "ws2_32.dll");

		return ffi.Library(winSocketDll, {
			"closesocket": ["int", ["uint"]],
			"recv": ["int", ["uint", CoreTypes.charPtr, "int", "int"]],
			"send": ["int", ["uint", "string", "int", "int"]],
			"setsockopt": ["int", ["uint", "int", "int", CoreTypes.voidPtr, "int"]]
		});
	}
}
$injector.register("iOSCore", IOSCore);

export class CoreFoundation implements  Mobile.ICoreFoundation {
	private coreFoundationLibrary: any;

	constructor($iOSCore: Mobile.IiOSCore) {
		this.coreFoundationLibrary = $iOSCore.getCoreFoundationLibrary();
	}

	public runLoopRun(): void {
		this.coreFoundationLibrary.CFRunLoopRun();
	}

	public runLoopGetCurrent(): any {
		return this.coreFoundationLibrary.CFRunLoopGetCurrent();
	}

	public getkCFRunLoopCommonModes(): NodeBuffer {
		var modes = this.coreFoundationLibrary.kCFRunLoopCommonModes;
		return modes.deref();
	}

	public runLoopTimerCreate(allocator: NodeBuffer, fireDate: number, interval: number, flags: number, order: number, callout: NodeBuffer, context: any): NodeBuffer {
		return this.coreFoundationLibrary.CFRunLoopTimerCreate(allocator, fireDate, interval, flags, order, callout, context);
	}

	public absoluteTimeGetCurrent(): number {
		return this.coreFoundationLibrary.CFAbsoluteTimeGetCurrent();
	}

	public runLoopAddTimer(r1: NodeBuffer, timer: NodeBuffer, mode: NodeBuffer): void {
		this.coreFoundationLibrary.CFRunLoopAddTimer(r1, timer, mode);
	}

	public runLoopRemoveTimer(r1: NodeBuffer, timer: NodeBuffer, mode: NodeBuffer): void {
		this.coreFoundationLibrary.CFRunLoopRemoveTimer(r1,  timer, mode);
	}

	public runLoopStop(r1: any): void {
		this.coreFoundationLibrary.CFRunLoopStop(r1);
	}

	public stringGetCStringPtr(theString: NodeBuffer, encoding: number): any {
		return this.coreFoundationLibrary.CFStringGetCStringPtr(theString, encoding);
	}

	public stringGetLength(theString: NodeBuffer): number {
		return this.coreFoundationLibrary.CFStringGetLength(theString);
	}

	public stringGetCString(theString: NodeBuffer, buffer: any, bufferSize: number, encoding: number): boolean {
		return this.coreFoundationLibrary.CFStringGetCString(theString, buffer, bufferSize, encoding);
	}

	public stringCreateWithCString(alloc: NodeBuffer, str: string, encoding: number): NodeBuffer {
		return this.coreFoundationLibrary.CFStringCreateWithCString(alloc, str, encoding);
	}

	public dictionaryGetValue(theDict: NodeBuffer, value: NodeBuffer): NodeBuffer {
		return this.coreFoundationLibrary.CFDictionaryGetValue(theDict, value);
	}

	public numberGetValue(number: NodeBuffer, theType: number, valuePtr: NodeBuffer): boolean {
		return this.coreFoundationLibrary.CFNumberGetValue(number, theType, valuePtr);
	}

	public  getTypeID(type: NodeBuffer): number {
		return this.coreFoundationLibrary.CFGetTypeID();
	}

	public dictionaryGetCount(theDict: NodeBuffer): number {
		return this.coreFoundationLibrary.CFDictionaryGetCount(theDict);
    }

	public createCFString(str: string): NodeBuffer {
		return this.stringCreateWithCString(null, str, IOSCore.kCFStringEncodingUTF8 );
	}

	public convertCFStringToCString(cfstr) {
		var result;
		if (cfstr != null) {
			result = this.stringGetCStringPtr(cfstr, IOSCore.kCFStringEncodingUTF8 );
			if (ref.address(result) === 0) {
				var cfstrLength = this.stringGetLength(cfstr);
				var length = cfstrLength + 1;
				var stringBuffer = new Buffer(length);
				var status = this.stringGetCString(cfstr, stringBuffer, length, IOSCore.kCFStringEncodingUTF8 );
				if (status) {
					result = stringBuffer.toString("utf8", 0, cfstrLength);
				} else {
					throw "Unable to convert string: " + result;
				}
			} else {
				result = ref.readCString(result, 0);
			}
		}

		return result;
	}
}
$injector.register("coreFoundation", CoreFoundation);

export class MobileDevice implements Mobile.IMobileDevice {
	private mobileDeviceLibrary: any;

	constructor($iOSCore: Mobile.IiOSCore) {
		this.mobileDeviceLibrary = $iOSCore.getMobileDeviceLibrary();
	}

	public deviceNotificationSubscribe(notificationCallback: NodeBuffer, p1: number, p2: number, p3: number, callbackSignature: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDeviceNotificationSubscribe(notificationCallback, p1, p2, p3, callbackSignature);
	}

	public deviceCopyDeviceIdentifier(devicePointer: NodeBuffer): NodeBuffer {
		return this.mobileDeviceLibrary.AMDeviceCopyDeviceIdentifier(devicePointer);
	}

	public deviceConnect(devicePointer: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDeviceConnect(devicePointer);
	}

	public deviceIsPaired(devicePointer: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDeviceIsPaired(devicePointer);
	}

	public devicePair(devicePointer: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDevicePair(devicePointer);
	}

	public deviceValidatePairing(devicePointer: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDeviceValidatePairing(devicePointer);
	}

	public deviceStartSession(devicePointer: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDeviceStartSession(devicePointer);
	}

	public deviceStopSession(devicePointer: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDeviceStopSession(devicePointer);
	}

	public deviceDisconnect(devicePointer: NodeBuffer): number {
		return this.mobileDeviceLibrary.AMDeviceDisconnect(devicePointer);
	}

    public deviceStartService(devicePointer: NodeBuffer, serviceName: NodeBuffer, socketNumber: NodeBuffer, p1: NodeBuffer) {
		return this.mobileDeviceLibrary.AMDeviceStartService(devicePointer, serviceName, socketNumber, p1);
	}

	public afcConnectionOpen(service: number, timeout: number, afcConnection: NodeBuffer): number {
		return this.mobileDeviceLibrary.AFCConnectionOpen(service, timeout, afcConnection);
	}

	public afcConnectionClose(afcConnection: NodeBuffer): number {
		return this.mobileDeviceLibrary.AFCConnectionClose(afcConnection);
	}

	public afcDirectoryCreate(afcConnection: NodeBuffer, path: string): number {
		return this.mobileDeviceLibrary.AFCDirectoryCreate(afcConnection, path);
	}

	public afcFileRefOpen(afcConnection: NodeBuffer, path: string, mode: number, timeout: number, afcFileRef: NodeBuffer): number {
		return this.mobileDeviceLibrary.AFCFileRefOpen(afcConnection, path, mode, timeout, afcFileRef);
	}

	public afcFileRefClose(afcConnection: NodeBuffer, afcFileRef: number): number {
		return this.mobileDeviceLibrary.AFCFileRefClose(afcConnection, afcFileRef);
	}

	public afcFileRefWrite(afcConnection: NodeBuffer, afcFileRef: number, buffer: NodeBuffer, byteLength: number): number {
		return this.mobileDeviceLibrary.AFCFileRefWrite(afcConnection, afcFileRef, buffer, byteLength);
	}

	public afcFileRefRead(afcConnection: NodeBuffer, afcFileRef: number, buffer: NodeBuffer, byteLength: number): number {
		return this.mobileDeviceLibrary.AFCFileRefRead(afcConnection, afcFileRef, buffer, byteLength);
	}

	public afcDirectoryOpen(afcConnection: NodeBuffer, path: string, afcDirectory: NodeBuffer): number {
		return this.mobileDeviceLibrary.AFCDirectoryOpen(afcConnection, path, afcDirectory);
	}

	public afcDirectoryRead(afcConnection: NodeBuffer, afcDirectory: NodeBuffer,  name: NodeBuffer): number {
		return this.mobileDeviceLibrary.AFCDirectoryRead(afcConnection, afcDirectory, name);
	}

	public afcDirectoryClose(afcConnection: NodeBuffer, afcDirectory: NodeBuffer): number {
		return this.mobileDeviceLibrary.AFCDirectoryClose(afcConnection, afcDirectory);
	}
}
$injector.register("mobileDevice", MobileDevice);

class iTunesInstallationInfo {
	// ITunes and Node.js installation validator
	private iTunesNotFoundErrorMessage = "iTunes is not installed";
	private iTunesMismatchNodeBitsErrorMessage = "iTunes mismatch node.js version.";

	constructor(private $fs: IFileSystem) {

	}

	public getAppleFolderLocation(): string {
		var isWindows64 = helpers.isWindows64();
		this.validateiTunesInstallation(isWindows64);

		if(isWindows64) {
			if(this.isNodeJs32BitsInstalled()) {
				return path.join(process.env["CommonProgramFiles(x86)"], "Apple");
			}
			else {
				return path.join(process.env.CommonProgramW6432, "Apple");
			}
		}
		else {
			return path.join(process.env.CommonProgramFiles, "Apple");
		}
	}

	private validateiTunesInstallation(isWindows64: boolean): void {
		if(!this.isiTunesInstalled()) {
			throw new Error(this.iTunesNotFoundErrorMessage);
		}

		if(isWindows64) {
			this.validateiTunesInstallationForWindows64();
		}
	}

	private validateiTunesInstallationForWindows64(): void {
		var existsPathToAppleFolderW6432 = this.$fs.exists(path.join(process.env.CommonProgramW6432, "Apple")).wait();
		var	existsPathToAppleFolderX86 = this.$fs.exists(path.join(process.env["CommonProgramFiles(x86)"], "Apple")).wait();

		if(this.isNodeJs32BitsInstalled()) {
			if(!existsPathToAppleFolderX86) {
				throw new Error(this.iTunesMismatchNodeBitsErrorMessage);
			}
		} else {
			if(!existsPathToAppleFolderW6432) {
				throw new Error(this.iTunesMismatchNodeBitsErrorMessage);
			}
		}
	}

	private isiTunesInstalled(): boolean {
		return this.$fs.exists(path.join(process.env.CommonProgramFiles, "Apple")).wait();
	}

	private isNodeJs32BitsInstalled() : boolean {
		return ref.types.size_t.size == 4;
	}
}

export class WinSocketWrapper {
	private winSocketLibrary: any = null;

	constructor(private socket: number) {
		this.winSocketLibrary = IOSCore.getWinSocketLibrary();
	}

	public read(bytes: number): NodeBuffer {
		var data = new Buffer(bytes);
		var result = this.winSocketLibrary.recv(this.socket, data, bytes, 0);
		if (result < 0) {
			throw "Error receiving data: " + result;
		}

		return data;
	}

	public write(data: string): number {
		return this.winSocketLibrary.send(this.socket, data, data.length, 0);
	}

	public close(): number {
		return this.winSocketLibrary.closesocket(this.socket);
	}
}

export class PlistService {
	private socket: WinSocketWrapper = null;

	constructor(private service: number) {
		this.socket = new WinSocketWrapper(service);
	}

	public get Service(): number {
		return this.service;
	}

	public receiveMessage(): string {
		var data = this.socket.read(4);
		var reply = "";

		if (data !== null && data.length === 4) {
			var l = bufferpack.unpack(">i", data)[0];
			var left = l;
			while (left > 0) {
				var r = this.socket.read(left);
				if (r === null) {
					throw "Unable to read reply";
				}
				reply += r;
				left -= r.length;
			}
		}

		return reply;
	}

	public receiveAll(condition: boolean): string {
		var reply = this.receiveMessage();

		while (condition) {
			reply += "\n" + this.receiveMessage();
		}

		return reply;
	}

	public sendMessage(data) {
		var payload = plistlib.toString(data);
		var message = bufferpack.pack(">i", [payload.length]) + payload;
		return this.socket.write(message);
	}

	public disconnect() {
		this.socket.close();
	}
}
$injector.register("plistService", PlistService);
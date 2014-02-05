///<reference path="../../.d.ts"/>

import ref = require("ref");
import os = require("os");
import _ = require("underscore");
import iOSProxyServices = require("./ios-proxy-services");
import Future = require("fibers/future");
import MobileHelper = require("./../mobile-helper");
import helpers = require("./../../helpers");

export class IOSDevice implements Mobile.IIOSDevice {

	private identifier: string = null;
	private voidPtr = ref.refType(ref.types.void);

	constructor(private devicePointer,
		private $coreFoundation: Mobile.ICoreFoundation,
		private $mobileDevice: Mobile.IMobileDevice,
		private $fs: IFileSystem,
		private $errors: IErrors) { }

	public getPlatform(): string {
		return MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.iOS].toLowerCase();
	}

	public getIdentifier(): string {
		if (this.identifier == null) {
			this.identifier = this.$coreFoundation.convertCFStringToCString(this.$mobileDevice.deviceCopyDeviceIdentifier(this.devicePointer));
		}

		return this.identifier;
	}

	public getDisplayName(): string {
		return this.getIdentifier();
	}

	public getDeviceProjectPath(appIdentifier: string): string {
		return "/Documents/";
	}

	private validateResult(result: number, error: string) {
		if (result != 0) {
			this.$errors.fail(error);
		}
	}

	private isPaired(): boolean {
		return this.$mobileDevice.deviceIsPaired(this.devicePointer) != 0;
	}

	private pair(): number {
		var result = this.$mobileDevice.devicePair(this.devicePointer);
		this.validateResult(result, "If your phone is locked with a passcode, unlock then reconnect it");
		return result;
	}

	private validatePairing() : number{
		var result = this.$mobileDevice.deviceValidatePairing(this.devicePointer);
		this.validateResult(result, "Unable to validate pairing");
		return result;
	}

	private connect() : number {
		var result = this.$mobileDevice.deviceConnect(this.devicePointer);
		this.validateResult(result, "Unable to connect to device");

		if (!this.isPaired()) {
			this.pair();
		}

		return this.validatePairing();
	}

	private disconnect() {
		var result = this.$mobileDevice.deviceDisconnect(this.devicePointer);
		this.validateResult(result, "Unable to disconnect from device");
	}

	private startSession() {
		var result = this.$mobileDevice.deviceStartSession(this.devicePointer);
		this.validateResult(result, "Unable to start session");
	}

	private stopSession() {
			var result = this.$mobileDevice.deviceStopSession(this.devicePointer);
			this.validateResult(result, "Unable to stop session");
	}

	public startService(serviceName: string): number {
		this.connect();
		try {
			this.startSession();
			try {
				var socket = ref.alloc("int");
				var result = this.$mobileDevice.deviceStartService(this.devicePointer, this.$coreFoundation.createCFString(serviceName), socket, null);
				this.validateResult(result, "Unable to start service");
				return ref.deref(socket);
			} finally {
				this.stopSession();
			}
		} finally {
			this.disconnect();
		}
	}

	public deploy(packageFile: string, packageName: string): void {
		var installationProxy = new iOSProxyServices.InstallationProxyClient(this, this.$coreFoundation, this.$mobileDevice, this.$fs, this.$errors);
		installationProxy.deployApplication(packageFile);
	}

	public sync(localToDevicePaths: Mobile.ILocalToDevicePathData[], appIdentifier: string): void {
		var houseArrestClient: Mobile.IHouseArressClient = new iOSProxyServices.HouseArrestClient(this, this.$mobileDevice, this.$fs, this.$errors);
		var afcClientForAppDocuments: Mobile.IAfcClient = houseArrestClient.getAfcClientForAppDocuments(appIdentifier);
		afcClientForAppDocuments.transferCollection(localToDevicePaths).wait();

		var notificationProxyClient: Mobile.INotificationProxyClient = new iOSProxyServices.NotificationProxyClient(this, this.$errors);
		notificationProxyClient.postNotification("com.telerik.app.refreshWebView");
		console.log("Successfully synced device with identifier '%s'", this.getIdentifier());
	}

	public openDeviceLogStream() {
		var iOSSystemLog = new iOSProxyServices.IOSSyslog(this, this.$errors);
		iOSSystemLog.read();
	}
}

$injector.register("iOSDevice", IOSDevice);
///<reference path="../../.d.ts"/>

import ref = require("ref");
import os = require("os");
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
		private $errors: IErrors,
		private $logger: ILogger,
		private $injector: IInjector) { }

	public getPlatform(): string {
		return MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.iOS];
	}

	public getIdentifier(): string {
		if (this.identifier == null) {
			this.identifier = this.$coreFoundation.convertCFStringToCString(this.$mobileDevice.deviceCopyDeviceIdentifier(this.devicePointer));
		}

		return this.identifier;
	}

	public getDisplayName(): string {
		return this.getValue("ProductType");
	}

	public getModel(): string {
		return this.getValue("ProductType");
	}

	public getVersion(): string {
		return this.getValue("ProductVersion");
	}

	public getVendor(): string {
		return "Apple";
	}

	private getValue(value: string): string {
		this.connect();
		this.startSession();
		try {
			var cfValue =  this.$coreFoundation.createCFString(value);
			return this.$coreFoundation.convertCFStringToCString(this.$mobileDevice.deviceCopyValue(this.devicePointer, null, cfValue));
		} finally {
			this.stopSession();
			this.disconnect();
		}
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
				var result = this.$mobileDevice.deviceStartService(this.devicePointer, this.$coreFoundation.createCFString(serviceName), socket);
				this.validateResult(result, "Unable to start service");
				return ref.deref(socket);
			} finally {
				this.stopSession();
			}
		} finally {
			this.disconnect();
		}
	}

	public deploy(packageFile: string, packageName: string): IFuture<void> {
		return (() => {
			var installationProxy = this.$injector.resolve(iOSProxyServices.InstallationProxyClient, {device: this });
			installationProxy.deployApplication(packageFile).wait();
			installationProxy.closeSocket();
		}).future<void>()();
	}

	public sync(localToDevicePaths: Mobile.ILocalToDevicePathData[], appIdentifier: Mobile.IAppIdentifier, options: Mobile.ISyncOptions = {}): IFuture<void> {
		return(() => {
			//TODO: CloseSocket must be part of afcClient. Refactor it.
			var houseArrestClient: Mobile.IHouseArrestClient = this.$injector.resolve(iOSProxyServices.HouseArrestClient, {device: this});
			var afcClientForAppDocuments = houseArrestClient.getAfcClientForAppDocuments(appIdentifier.appIdentifier);
			afcClientForAppDocuments.transferCollection(localToDevicePaths).wait();
			houseArrestClient.closeSocket();

			if (!options.skipRefresh) {
				var afcClientForContainer = houseArrestClient.getAfcClientForAppContainer(appIdentifier.appIdentifier);
				afcClientForContainer.deleteFile("/Library/Preferences/ServerInfo.plist");
				houseArrestClient.closeSocket();

				var notificationProxyClient = this.$injector.resolve(iOSProxyServices.NotificationProxyClient, {device: this});
				notificationProxyClient.postNotification("com.telerik.app.refreshWebView");
				notificationProxyClient.closeSocket();

				this.$logger.out("Successfully synced device with identifier '%s'", this.getIdentifier());
			}

		}).future<void>()();
	}

	public openDeviceLogStream() {
		var iOSSystemLog = this.$injector.resolve(iOSProxyServices.IOSSyslog, {device: this});
		iOSSystemLog.read();
	}
}

$injector.register("iOSDevice", IOSDevice);
///<reference path="../.d.ts"/>

declare module Mobile {

	interface ISyncOptions {
		skipRefresh?: boolean;
	}

	interface IDevice {
		getIdentifier(): string;
		getDisplayName(): string;
		getModel(): string;
		getVersion(): string;
		getVendor(): string;
		getPlatform(): string;
		deploy(packageFile: string, packageName: string): IFuture<void>;
		sync(localToDevicePaths: ILocalToDevicePathData[], appIdentifier: IAppIdentifier): IFuture<void>;
		sync(localToDevicePaths: ILocalToDevicePathData[], appIdentifier: IAppIdentifier, options: ISyncOptions): IFuture<void>;
		openDeviceLogStream(): void;
	}

	interface IAppIdentifier {
		appIdentifier: string;
		deviceProjectPath: string;
		isLiveSyncSupported(device: IDevice): IFuture<boolean>;
	}

	interface IIOSDevice extends IDevice {
		startService(serviceName: string): number;
	}

	interface IDeviceDiscovery {
		deviceFound: ISignal;
		deviceLost: ISignal;
		startLookingForDevices?(): IFuture<void>;
	}

	interface IDevicesServicesInitializationOptions {
		skipInferPlatform?: boolean;
	}

	interface IDevicesServices {
		hasDevices: boolean;
		deviceCount: number;
		execute(action: (device: Mobile.IDevice) => IFuture<void>, canExecute?: (dev: Mobile.IDevice) => boolean, options?: {allowNoDevices?: boolean}): IFuture<void>;
		initialize(platform: string, deviceOption?: string, options?: IDevicesServicesInitializationOptions): IFuture<void>;
		platform: string;
	}

	interface IiOSCore {
		getCoreFoundationLibrary(): any;
		getMobileDeviceLibrary(): any;
	}

	interface ICoreFoundation {
		runLoopRun(): void;
		runLoopGetCurrent(): any;
		stringCreateWithCString(alloc: NodeBuffer, str: string, encoding: number): NodeBuffer;
		dictionaryGetValue(theDict: NodeBuffer, value: NodeBuffer): NodeBuffer;
		numberGetValue(number: NodeBuffer, theType: number, valuePtr: NodeBuffer): boolean;
		kCFRunLoopCommonModes(): NodeBuffer;
		kCFRunLoopDefaultMode(): NodeBuffer;
		kCFTypeDictionaryKeyCallBacks(): NodeBuffer;
		kCFTypeDictionaryValueCallBacks(): NodeBuffer;
		runLoopTimerCreate(allocator: NodeBuffer, fireDate: number, interval: number, flags: number, order: number, callout: NodeBuffer, context: any): NodeBuffer;
		absoluteTimeGetCurrent(): number;
		runLoopAddTimer(r1: NodeBuffer, timer: NodeBuffer, mode: NodeBuffer): void;
		runLoopRemoveTimer(r1: NodeBuffer, timer: NodeBuffer, mode: NodeBuffer): void;
		runLoopStop(r1: any): void;
		convertCFStringToCString(cfstr);
		dictionaryCreate(allocator: NodeBuffer, keys: NodeBuffer, values: NodeBuffer, count: number, dictionaryKeyCallbacks: NodeBuffer, dictionaryValueCallbacks: NodeBuffer): NodeBuffer;
		getTypeID(type: NodeBuffer): number;
		stringGetCString(theString: NodeBuffer, buffer: NodeBuffer, bufferSize: number, encoding: number): boolean;
		stringGetLength(theString: NodeBuffer): number;
		dictionaryGetCount(theDict: NodeBuffer): number;
		createCFString(str: string): NodeBuffer;
		dictToPlistEncoding(dict: {[key: string]: {}}, format: number);
		dictFromPlistEncoding(s, format?: number);
		dictionaryGetTypeID(): number;
		stringGetTypeID(): number;
		dataGetTypeID():  number;
		numberGetTypeID(): number;
		booleanGetTypeID(): number;
		arrayGetTypeID(): number;
		dateGetTypeID(): number;
		setGetTypeID(): number;
		dictionaryGetKeysAndValues(dictionary: NodeBuffer, keys: NodeBuffer, values: NodeBuffer): void;
	}

	interface IMobileDevice {
		deviceNotificationSubscribe(notificationCallback: NodeBuffer, p1: number, p2: number, context: any, callbackSignature: NodeBuffer): number;
		deviceCopyDeviceIdentifier(devicePointer: NodeBuffer): NodeBuffer;
		deviceCopyValue(devicePointer: NodeBuffer, domain: NodeBuffer, name: NodeBuffer);
		deviceConnect(devicePointer: NodeBuffer): number;
		deviceIsPaired(devicePointer: NodeBuffer): number;
		devicePair(devicePointer: NodeBuffer): number;
		deviceValidatePairing(devicePointer: NodeBuffer): number;
		deviceStartSession(devicePointer: NodeBuffer): number;
		deviceStopSession(devicePointer: NodeBuffer): number;
		deviceDisconnect(devicePointer: NodeBuffer): number;
		deviceStartService(devicePointer: NodeBuffer, serviceName: NodeBuffer, socketNumber: NodeBuffer);
		deviceTransferApplication(service: number, packageFile: NodeBuffer, options: NodeBuffer, installationCallback: NodeBuffer): number;
		deviceInstallApplication(service: number, packageFile: NodeBuffer, options: NodeBuffer, installationCallback: NodeBuffer): number;
		afcConnectionOpen(service: number, timeout: number, afcConnection: NodeBuffer): number;
		afcConnectionClose(afcConnection: NodeBuffer): number;
		afcDirectoryCreate(afcConnection: NodeBuffer, path: string): number;
		afcFileRefOpen(afcConnection: NodeBuffer, path: string, mode: number, afcFileRef: NodeBuffer): number;
		afcFileRefClose(afcConnection: NodeBuffer, afcFileRef: number): number;
		afcFileRefWrite(afcConnection: NodeBuffer, afcFileRef: number, buffer: NodeBuffer, byteLength: number): number;
		afcFileRefRead(afcConnection: NodeBuffer, afcFileRef: number, buffer: NodeBuffer, byteLength: number): number;
		afcRemovePath(afcConnection: NodeBuffer, path: string): number;
		afcDirectoryOpen(afcConnection: NodeBuffer, path: string, afcDirectory: NodeBuffer): number;
		afcDirectoryRead(afcConnection: NodeBuffer, afcdirectory: NodeBuffer,  name: NodeBuffer): number;
		afcDirectoryClose(afcConnection: NodeBuffer, afcdirectory: NodeBuffer): number;
		isDataReceivingCompleted(reply: string): boolean;
	}

	interface IInstallationProxyClient {
		deploy(packageFile: string, packageName: string);
	}

	interface INotificationProxyClient {
		postNotification(notificationName: string);
	}

	interface IHouseArrestClient {
		getAfcClientForAppDocuments(applicationIdentifier: string): Mobile.IAfcClient;
		getAfcClientForAppContainer(applicationIdentifier: string): Mobile.IAfcClient;
		closeSocket(): void;
	}

	interface IAfcClient {
		transferCollection(localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void>;
		deleteFile(devicePath: string): void;
	}

	interface ILocalToDevicePathData {
		getLocalPath(): string;
		getDevicePath(): string;
		getRelativeToProjectBasePath(): string;
	}

	interface IiOSDeviceSocket {
		receiveMessage(): IFuture<void>;
		readSystemLog(action: (data: string) => void): void;
		sendMessage(message: {[key: string]: {}}, format?: number): void;
		close(): void;
	}

	interface IPlatformCapabilities {
		wirelessDeploy: boolean;
		cableDeploy: boolean;
		companion: boolean;
	}
}
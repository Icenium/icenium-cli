///<reference path="../.d.ts"/>

declare module Mobile {

	interface IDevice {
		getIdentifier(): string;
		getDisplayName(): string;
		getPlatform(): string;
		getDeviceProjectPath(appIdentifier: string): string;
		deploy(packageFile: string, packageName: string): void;
		sync(localToDevicePaths: ILocalToDevicePathData[], appIdentifier: string): void;
		openDeviceLogStream(): void;
	}

	interface IIOSDevice extends IDevice {
		startService(serviceName: string): number;
	}

	interface IDeviceDiscovery {
		deviceFound: ISignal;
		deviceLost: ISignal;
		startLookingForDevices?(): IFuture<void>;
    }

	interface IDevicesServices {
		executeOnAllConnectedDevices(action:  (device: Mobile.IDevice) => IFuture<any>, platform?: string, canExecute?: (dev: Mobile.IDevice) => boolean): IFuture<void>;
		executeOnDevice(action: any, identifier?: string, index?: number): IFuture<void>;
		hasDevices(platform?: string): boolean;
		hasDevice(identifier: string): boolean;
	}

	interface IiOSCore {
		getCoreFoundationLibrary(): any;
		getMobileDeviceLibrary(): any;
		getWinSocketLibrary(): any;
	}

	interface ICoreFoundation {
		runLoopRun(): void;
		runLoopGetCurrent(): any;
		stringCreateWithCString(alloc: NodeBuffer, str: string, encoding: number): NodeBuffer;
		dictionaryGetValue(theDict: NodeBuffer, value: NodeBuffer): NodeBuffer;
		numberGetValue(number: NodeBuffer, theType: number, valuePtr: NodeBuffer): boolean;
		getkCFRunLoopCommonModes(): NodeBuffer;
		runLoopTimerCreate(allocator: NodeBuffer, fireDate: number, interval: number, flags: number, order: number, callout: NodeBuffer, context: any): NodeBuffer;
		absoluteTimeGetCurrent(): number;
		runLoopAddTimer(r1: NodeBuffer, timer: NodeBuffer, mode: NodeBuffer): void;
		runLoopRemoveTimer(r1: NodeBuffer, timer: NodeBuffer, mode: NodeBuffer): void;
		runLoopStop(r1: any): void;
		convertCFStringToCString(cfstr);
		getTypeID(type: NodeBuffer): number;
		stringGetCString(theString: NodeBuffer, buffer: NodeBuffer, bufferSize: number, encoding: number): boolean;
		stringGetLength(theString: NodeBuffer): number;
		dictionaryGetCount(theDict: NodeBuffer): number;
		createCFString(str: string): NodeBuffer;
	}

	interface IMobileDevice {
		deviceNotificationSubscribe(notificationCallback: NodeBuffer, p1: number, p2: number, context: any, callbackSignature: NodeBuffer): number;
		deviceCopyDeviceIdentifier(devicePointer: NodeBuffer): NodeBuffer;
		deviceConnect(devicePointer: NodeBuffer): number;
		deviceIsPaired(devicePointer: NodeBuffer): number;
		devicePair(devicePointer: NodeBuffer): number;
		deviceValidatePairing(devicePointer: NodeBuffer): number;
		deviceStartSession(devicePointer: NodeBuffer): number;
		deviceStopSession(devicePointer: NodeBuffer): number;
		deviceDisconnect(devicePointer: NodeBuffer): number;
		deviceStartService(devicePointer: NodeBuffer, serviceName: NodeBuffer, socketNumber: NodeBuffer, p1: NodeBuffer);
		afcConnectionOpen(service: number, timeout: number, afcConnection: NodeBuffer): number;
		afcConnectionClose(afcConnection: NodeBuffer): number;
		afcDirectoryCreate(afcConnection: NodeBuffer, path: string): number;
		afcFileRefOpen(afcConnection: NodeBuffer, path: string, mode: number, timeout: number, afcFileRef: NodeBuffer): number;
		afcFileRefClose(afcConnection: NodeBuffer, afcFileRef: number): number;
		afcFileRefWrite(afcConnection: NodeBuffer, afcFileRef: number, buffer: NodeBuffer, byteLength: number): number;
		afcFileRefRead(afcConnection: NodeBuffer, afcFileRef: number, buffer: NodeBuffer, byteLength: number): number;
		afcDirectoryOpen(afcConnection: NodeBuffer, path: string, afcDirectory: NodeBuffer): number;
		afcDirectoryRead(afcConnection: NodeBuffer, afcdirectory: NodeBuffer,  name: NodeBuffer): number;
		afcDirectoryClose(afcConnection: NodeBuffer, afcdirectory: NodeBuffer): number;
	}

	interface IWinSocketWrapper {
		read(bytes: number): NodeBuffer;
		write(data: string): number;
		close(): number;
	}

	interface PlistService {
		receiveMessage(): string;
		sendMessage(data): number;
    }

	interface IInstallationProxyClient {
		deploy(packageFile: string, packageName: string);
	}

	interface INotificationProxyClient {
		postNotification(notificationName: string);
	}

	interface IHouseArressClient {
		getAfcClientForAppDocuments(applicationIdentifier: string): Mobile.IAfcClient;
		getAfcClientForAppContainer(applicationIdentifier: string): Mobile.IAfcClient;
	}

	interface IAfcClient {
		transferCollection(localToDevicePaths: Mobile.ILocalToDevicePathData[]): IFuture<void>;
	}

	interface ILocalToDevicePathData {
		getLocalPath(): string;
		getDevicePath(): string;
		getRelativeToProjectBasePath(): string;
	}
}
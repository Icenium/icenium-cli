import * as path from "path";

export class DarwinDebuggerService implements IDebuggerService {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $androidEmulatorServices: Mobile.IAndroidEmulatorServices,
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery,
		private $clipboardService: IClipboardService,
		private $opener: IOpener,
		private $errors: IErrors,
		private $logger: ILogger,
		private $prompter: IPrompter) { }

	public debugIosApplication(applicationId: string): void {
		let pathToDebuggingGuideHtml = path.join(__dirname, "..", "..", "..", "resources", "debugging", "ios-debug-guide.html");

		this.$opener.open(`${pathToDebuggingGuideHtml}`, "Safari");
	}

	public debugAndroidApplication(applicationId: string): IFuture<void> {
		return (() => {
			let deviceIdentifier: string;
			this.$devicesService.detectCurrentlyAttachedDevices().wait();
			let connectedDevices = this.$devicesService.getDevicesForPlatform("android");

			if (connectedDevices.length > 1) {
				let devicesNames: string[] = connectedDevices.map((device: Mobile.IDevice) => device.deviceInfo.displayName);
				let selectedDeviceName = this.$prompter.promptForChoice("You have more than one Android devices connected to your computer. Please choose which one to use", devicesNames).wait();

				deviceIdentifier = connectedDevices.filter((device: Mobile.IDevice) => device.deviceInfo.displayName === selectedDeviceName)[0].deviceInfo.identifier;
			} else if (connectedDevices.length === 1) {
				deviceIdentifier = connectedDevices[0].deviceInfo.identifier;
			} else {
				deviceIdentifier = this.$androidEmulatorServices.startEmulator().wait();
			}

			let applicationsAvailableForDebugging = this.$androidProcessService.getApplicationsAvailableForDebugging(deviceIdentifier).wait();
			let applicationNotStartedErrorMessage = `Application with identifier ${applicationId} is not started on device ${deviceIdentifier}. Please open the application on the device to debug it.`;

			if (!_.contains(applicationsAvailableForDebugging, applicationId)) {
				this.$errors.failWithoutHelp(applicationNotStartedErrorMessage);
			}

			let tcpPort: string;

			try {
				tcpPort = this.$androidProcessService.mapAbstractToTcpPort(deviceIdentifier, applicationId).wait();
			} catch (err) {
				this.$errors.failWithoutHelp("Your device has no open ports. Please close programs that are using device's ports to listen on them and try again.");
			}

			let inspectorAddress = `chrome://inspect:${tcpPort}`;
			this.$clipboardService.copy(inspectorAddress).wait();

			this.$logger.out(`Your application is available for debugging on port: ${tcpPort}.`);
			this.$logger.out(`Open Google Chrome and in the address bar enter ${inspectorAddress}. You can just paste it, it is already copied to your clipboard.`);
		}).future<void>()();
	}
}

$injector.register("darwinDebuggerService", DarwinDebuggerService);

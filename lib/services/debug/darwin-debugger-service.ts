///<reference path="../../.d.ts"/>
"use strict";

import * as shelljs from "shelljs";
import {EOL} from "os";

export class DarwinDebuggerService implements IDebuggerService {
	constructor(private $childProcess: IChildProcess,
		private $devicesService: Mobile.IDevicesService,
		private $androidEmulatorServices: Mobile.IAndroidEmulatorServices,
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $androidDeviceDiscovery: Mobile.IAndroidDeviceDiscovery,
		private $clipboardService: IClipboardService,
		private $opener: IOpener,
		private $errors: IErrors,
		private $logger: ILogger,
		private $prompter: IPrompter) { }

	public debugIosApplication(applicationId: string): void {
		// Check if the proxy is installed.
		try {
			this.$childProcess.spawnFromEvent("ios_webkit_debug_proxy", ["--help"], "close").wait();
		} catch (err) {
			this.$errors.failWithoutHelp("If you want to debug for iOS you need to install ios-webkit-debug-proxy using 'brew install ios-webkit-debug-proxy'.");
		}

		// Start devtools server.
		this.$childProcess.spawn("ios_webkit_debug_proxy");

		// The child_process does not receive "data" event when using this plugin. That's why we need to check for the devtools port manually.

		// The grep must be ios_webki.
		// The output will look like this:
		// ios_webki 26903 blackdragon    3u  IPv4 0x5377cd482a2d40e3      0t0  TCP *:9221 (LISTEN)
		// ios_webki 26903 blackdragon    5u  IPv4 0x5377cd4846656da3      0t0  TCP *:teamcoherence (LISTEN)
		let lsofResult = shelljs.exec("lsof -i | grep ios_webki").output;
		let portRegExp = /TCP \*:(\d+)/g;

		let devToolsPortMatches = portRegExp.exec(lsofResult);

		if (!devToolsPortMatches) {
			this.$errors.failWithoutHelp("Devtools failed to run. Please run the command again and if the problem exists reinstall ios-webkit-debug-proxy and try again.");
		}

		let devToolsPort = devToolsPortMatches[1];

		process.on("SIGINT", () => {
			this.killIosWebkitDebugProxyProcesses();
		});

		process.on("SIGTERM", () => {
			this.killIosWebkitDebugProxyProcesses();
		});

		this.$opener.open(`http://localhost:${devToolsPort}`, "safari");
		this.$logger.out("To stop the debugger press Ctrl + C");
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

	private killIosWebkitDebugProxyProcesses(): void {
		// The output will look like this:
		// UID   PID   PPID   C  STIME   TTY           TIME CMD
		// 501   9225     1   0  5:54PM  ttys002       0:00.03 ios_webkit_debug_proxy
		let processes = shelljs.exec("ps -ef | grep ios_webkit_debug_proxy").output.split(EOL) || [];
		let processIdRegExp = /\d+\s+(\d+)\s+/;

		_.each(processes, (processInfo: string) => {
			let processIdMatches = processIdRegExp.exec(processInfo);

			if (processIdMatches && processIdMatches[1]) {
				shelljs.exec(`kill -9 ${processIdMatches[1]}`);
			}
		});
	}
}

$injector.register("darwinDebuggerService", DarwinDebuggerService);

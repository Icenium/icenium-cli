"use strict";
import * as path from "path";
import platformServicesRunValidatorLib = require("./platform-services-run-validator");

class WinSimulatorPlatformServices extends platformServicesRunValidatorLib.PlatformServicesRunValidator implements IExtensionPlatformServices {
	private static PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Tools.Package";
	private static EXECUTABLE_NAME_WIN = "Icenium.Simulator.exe";

	constructor(private $childProcess: IChildProcess,
				private $hostInfo: IHostInfo,
				$errors: IErrors,
				$hostCapabilities: IHostCapabilities,
				$project: Project.IProject) {
					super($errors, $hostCapabilities, $project);
	}

	public get packageName(): string {
		return WinSimulatorPlatformServices.PACKAGE_NAME_WIN;
	}

	public get executableName(): string {
		return WinSimulatorPlatformServices.EXECUTABLE_NAME_WIN;
	}

	public runApplication(applicationPath: string, applicationParams: string[]): void {
		let simulatorBinary = path.join(applicationPath, WinSimulatorPlatformServices.EXECUTABLE_NAME_WIN);
		this.$childProcess.spawn(simulatorBinary, applicationParams,
			{ stdio: "ignore", detached: true }).unref();
	}

	public canRunApplication(): IFuture<boolean> {
		return (() => {
			return super.canRunApplication().wait() && this.$hostInfo.isDotNet40Installed("Unable to start the simulator. Verify that you have installed .NET 4.0 or later and try again.").wait();
		}).future<boolean>()();
	}
}

class MacSimulatorPlatformServices extends platformServicesRunValidatorLib.PlatformServicesRunValidator implements IExtensionPlatformServices {
	private static PACKAGE_NAME_MAC: string = "Telerik.BlackDragon.Client.Mobile.Tools.Mac.Package";
	private static EXECUTABLE_NAME_MAC = "AppBuilder Simulator";
	private static EXECUTABLE_NAME_MAC_APP = MacSimulatorPlatformServices.EXECUTABLE_NAME_MAC + ".app";

	constructor(private $childProcess: IChildProcess,
				$errors: IErrors,
				$hostCapabilities: IHostCapabilities,
				$project: Project.IProject) {
					super($errors, $hostCapabilities, $project);
	}

	public get packageName() : string {
		return MacSimulatorPlatformServices.PACKAGE_NAME_MAC;
	}

	public get executableName(): string {
		return MacSimulatorPlatformServices.EXECUTABLE_NAME_MAC;
	}

	public runApplication(applicationPath: string, applicationParams: string[]): void {
		let simulatorBinary = path.join(applicationPath, MacSimulatorPlatformServices.EXECUTABLE_NAME_MAC_APP);
		let commandLine = [simulatorBinary, '--args'].concat(applicationParams);
		this.$childProcess.spawn('open', commandLine,
			{ stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
	}

	public canRunApplication(): IFuture<boolean> {
		return super.canRunApplication();
	}
}

let hostInfo: IHostInfo = $injector.resolve("hostInfo");
if(hostInfo.isWindows) {
	$injector.register("simulatorPlatformServices", WinSimulatorPlatformServices);
} else if(hostInfo.isDarwin) {
	$injector.register("simulatorPlatformServices", MacSimulatorPlatformServices);
} else {
	$injector.register("simulatorPlatformServices", {});
}

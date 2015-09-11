///<reference path="../.d.ts"/>
"use strict";

import * as path from "path";
import minimatch = require("minimatch");

export class EmulateAndroidCommand implements ICommand {
	constructor(private $project: Project.IProject,
				private $buildService: Project.IBuildService,
				private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
				private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
				private $options: IOptions) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureAllPlatformAssets().wait();
			this.$androidEmulatorServices.checkAvailability().wait();
			let tempDir = this.$project.getTempDir("emulatorfiles").wait();
			let packageFilePath = path.join(tempDir, "package.apk");
			this.$buildService.build(<Project.IBuildSettings>{
				platform: this.$devicePlatformsConstants.Android,
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();
			this.$options.justlaunch = true;
			this.$androidEmulatorServices.startEmulator(packageFilePath, <Mobile.IEmulatorOptions>{ appId: this.$project.projectData.AppIdentifier }).wait();
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			this.$project.ensureProject();
			this.$androidEmulatorServices.checkDependencies().wait();
			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("emulate|android", EmulateAndroidCommand);

export class EmulateIosCommand implements ICommand {
	constructor(private $fs: IFileSystem,
				private $project: Project.IProject,
				private $buildService: Project.IBuildService,
				private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
				private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
				private $options: IOptions) {
		this.$project.ensureProject();
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureAllPlatformAssets().wait();
			this.$iOSEmulatorServices.checkDependencies().wait();
			this.$iOSEmulatorServices.checkAvailability().wait();
			let app = "";

			if(!this.$options.availableDevices) {
				let tempDir = this.$project.getTempDir("emulatorfiles").wait();
				let packageFile = this.$buildService.buildForDeploy(this.$devicePlatformsConstants.iOS, path.join(tempDir, "package.ipa"), true).wait();
				this.$fs.unzip(packageFile, tempDir).wait();
			 	app = path.join(tempDir, this.$fs.readDirectory(tempDir).wait().filter(minimatch.filter("*.app"))[0]);
			}

			this.$iOSEmulatorServices.startEmulator(app).wait();

		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			this.$project.ensureProject();
			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("emulate|ios", EmulateIosCommand);

export class EmulateWp8Command implements ICommand {
	constructor(private $project: Project.IProject,
		private $buildService: Project.IBuildService,
		private $wp8EmulatorServices: Mobile.IEmulatorPlatformServices,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig) {
		this.$project.ensureProject();
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureAllPlatformAssets().wait();
			this.$wp8EmulatorServices.checkDependencies().wait();
			this.$wp8EmulatorServices.checkAvailability().wait();

			let tempDir = this.$project.getTempDir("emulatorfiles").wait();
			let packageFilePath = path.join(tempDir, "package.xap");
			this.$buildService.build(<Project.IBuildSettings>{
				platform: this.$devicePlatformsConstants.WP8,
				configuration: "Debug",
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			this.$wp8EmulatorServices.startEmulator(packageFilePath).wait();
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			this.$project.ensureProject();
			return true;
		}).future<boolean>()();
	}

	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand("emulate|wp8", EmulateWp8Command);

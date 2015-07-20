///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Fiber = require("fibers");
import Future = require("fibers/future");
import minimatch = require("minimatch");
import iconv = require("iconv-lite");
import osenv = require("osenv");
import helpers = require("../helpers");

export class EmulateAndroidCommand implements ICommand {
	constructor(private $project: Project.IProject,
				private $buildService: Project.IBuildService,
				private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
				private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$androidEmulatorServices.checkDependencies().wait();
			this.$androidEmulatorServices.checkAvailability().wait();

			let tempDir = this.$project.getTempDir("emulatorfiles").wait();
			let packageFilePath = path.join(tempDir, "package.apk");
			let packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: this.$devicePlatformsConstants.Android,
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			this.$androidEmulatorServices.startEmulator(packageFilePath, <Mobile.IEmulatorOptions>{ appId: this.$project.projectData.AppIdentifier }).wait();
		}).future<void>()();
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
			this.$iOSEmulatorServices.checkDependencies().wait();
			this.$iOSEmulatorServices.checkAvailability().wait();
			let app = "";

			if(!this.$options.availableDevices) {
				let tempDir = this.$project.getTempDir("emulatorfiles").wait();
				let packageDefs = this.$buildService.build(<Project.IBuildSettings>{
					platform: this.$devicePlatformsConstants.iOS,
					showQrCodes: false,
					downloadFiles: true,
					downloadedFilePath: path.join(tempDir, "package.ipa"),
					buildForiOSSimulator: true
				}).wait();
				this.$fs.unzip(packageDefs[0].localFile, tempDir).wait();
			 	app = path.join(tempDir, this.$fs.readDirectory(tempDir).wait().filter(minimatch.filter("*.app"))[0]);
			}

			this.$iOSEmulatorServices.startEmulator(app).wait();

		}).future<void>()();
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
			this.$wp8EmulatorServices.checkDependencies().wait();
			this.$wp8EmulatorServices.checkAvailability().wait();

			let tempDir = this.$project.getTempDir("emulatorfiles").wait();
			let packageFilePath = path.join(tempDir, "package.xap");
			let packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: this.$devicePlatformsConstants.WP8,
				configuration: "Debug",
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			this.$wp8EmulatorServices.startEmulator(packageFilePath).wait();
		}).future<void>()();
	}
	
	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand("emulate|wp8", EmulateWp8Command);

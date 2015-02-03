///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Fiber = require("fibers");
import Future = require("fibers/future");
import minimatch = require("minimatch");
import iconv = require("iconv-lite");
import osenv = require("osenv");
import helpers = require("../helpers");
import MobileHelper = require("../common/mobile/mobile-helper");
import AppIdentifier = require("../common/mobile/app-identifier");
import options = require("../options");

export class EmulateAndroidCommand implements ICommand {
	constructor(private $project: Project.IProject,
				private $buildService: Project.IBuildService,
				private $androidEmulatorServices: Mobile.IEmulatorPlatformServices) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$androidEmulatorServices.checkDependencies().wait();
			this.$androidEmulatorServices.checkAvailability().wait();

			var tempDir = this.$project.getTempDir("emulatorfiles").wait();
			var packageFilePath = path.join(tempDir, "package.apk");
			var packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.Android],
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			var appId = AppIdentifier.createAppIdentifier(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.Android], this.$project.projectData.AppIdentifier, options.companion);
			this.$androidEmulatorServices.startEmulator(packageFilePath, <Mobile.IEmulatorOptions>{appId:appId.appIdentifier }).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("emulate|android", EmulateAndroidCommand);

export class EmulateIosCommand implements ICommand {
	constructor(private $fs: IFileSystem,
				private $project: Project.IProject,
				private $buildService: Project.IBuildService,
				private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices) {
		this.$project.ensureProject();
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$iOSEmulatorServices.checkDependencies().wait();
			this.$iOSEmulatorServices.checkAvailability().wait();
			var app = "";

			if(!options.availableDevices) {
				var tempDir = this.$project.getTempDir("emulatorfiles").wait();
				var packageDefs = this.$buildService.build(<Project.IBuildSettings>{
					platform: MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.iOS],
					configuration: "Debug",
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
	constructor(private $project: Project.IProject
		,private $buildService: Project.IBuildService
		,private $wp8EmulatorServices: Mobile.IEmulatorPlatformServices) {
		this.$project.ensureProject();
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$wp8EmulatorServices.checkDependencies().wait();
			this.$wp8EmulatorServices.checkAvailability().wait();

			var tempDir = this.$project.getTempDir("emulatorfiles").wait();
			var packageFilePath = path.join(tempDir, "package.xap");
			var packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.WP8],
				configuration: "Debug",
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			this.$wp8EmulatorServices.startEmulator(packageFilePath).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("emulate|wp8", EmulateWp8Command);

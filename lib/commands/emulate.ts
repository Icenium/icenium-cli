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
import constants = require("../common/mobile/constants");

export class EmulateCommand {
	private static ANDROID_DIR_NAME = ".android";
	private static AVD_DIR_NAME = "avd";
	private static INI_FILES_MASK = /^(.*)\.ini$/i;
	private static ENCODING_MASK = /^avd\.ini\.encoding=(.*)$/;
	private static CORDOVA_REQURED_ANDROID_APILEVEL = 10; // 2.3 Gingerbread
	private static NATIVESCRIPT_REQURED_ANDROID_APILEVEL = 17; // 4.2 JellyBean

	constructor(private $errors: IErrors
				,private $fs: IFileSystem
				,private $project: Project.IProject
				,private $projectTypes: IProjectTypes
				,private $buildService: Project.IBuildService
				,private $loginManager: ILoginManager
				,private $androidEmulatorServices: IEmulatorPlatformServices
				,private $iOSEmulatorServices: IEmulatorPlatformServices
				,private $wp8EmulatorServices: IEmulatorPlatformServices) {
		iconv.extendNodeEncodings();
		this.$project.ensureProject();
		this.$loginManager.ensureLoggedIn().wait();
	}

	public runAndroid(args: string[]): IFuture<void> {
		return (() => {
			this.$androidEmulatorServices.checkAvailability().wait();

			var tempDir = this.createTempDir().wait();
			var packageFilePath = path.join(tempDir, "package.apk");
			var packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: MobileHelper.normalizePlatformName("Android"),
				configuration: "Debug",
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			var image: string = args[1] || this.getBestFit().wait();
			if (image) {
				this.$androidEmulatorServices.startEmulator(packageFilePath, image).wait();
			} else {
				this.$errors.fail("Could not find an emulator image to run your project.");
			}
		}).future<void>()();
	}

	public runIos(args: string[]): IFuture<void> {
		return (() => {
			this.$iOSEmulatorServices.checkAvailability().wait();

			var tempDir = this.createTempDir().wait();
			var packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: MobileHelper.normalizePlatformName("iOS"),
				configuration: "Debug",
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: path.join(tempDir, "package.zip"),
				provisionTypes: [constants.ProvisionType.AdHoc, constants.ProvisionType.Development],
				buildForiOSSimulator: true
			}).wait();
			this.$fs.unzip(packageDefs[0].localFile, tempDir).wait();

			var app = path.join(tempDir, this.$fs.readDirectory(tempDir).wait().filter(minimatch.filter("*.app"))[0]);
			this.$iOSEmulatorServices.startEmulator(app).wait();
		}).future<void>()();
	}

	public runWp8(args: string[]): IFuture<void> {
		return (() => {
			this.$wp8EmulatorServices.checkAvailability().wait();

			var tempDir = this.createTempDir().wait();
			var packageFilePath = path.join(tempDir, "package.xap");
			var packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: MobileHelper.normalizePlatformName("WP8"),
				configuration: "Debug",
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			this.$wp8EmulatorServices.startEmulator(packageFilePath).wait();
		}).future<void>()();
	}

	private createTempDir(): IFuture<string> {
		return (() => {
			var dir = path.join(this.$project.getProjectDir().wait(), ".ab");
			this.$fs.createDirectory(dir).wait();
			dir = path.join(dir, "emulatorfiles");
			this.$fs.createDirectory(dir).wait();
			return dir;
		}).future<string>()();
	}

	private getBestFit(): IFuture<string> {
		return (() => {
			var minVersion = (this.$project.projectType === this.$projectTypes.Cordova)
				? EmulateCommand.CORDOVA_REQURED_ANDROID_APILEVEL
				: EmulateCommand.NATIVESCRIPT_REQURED_ANDROID_APILEVEL;

			var best =_.chain(this.getAvds().wait())
					 .map(avd => this.getInfoFromAvd(avd).wait())
					 .max(avd => avd.targetNum)
					.value();

			return (best.targetNum >= minVersion) ? best.name : null;
		}).future<string>()();
	}

	private getInfoFromAvd(avdName: string): IFuture<Mobile.IAvdInfo> {
		return (() => {
			var iniFile = path.join(this.avdDir, avdName + ".ini");
			var avdInfo: Mobile.IAvdInfo = this.parseAvdFile(avdName, iniFile).wait();
			if (avdInfo.path && this.$fs.exists(avdInfo.path).wait()) {
				iniFile = path.join(avdInfo.path, "config.ini");
				avdInfo = this.parseAvdFile(avdName, iniFile, avdInfo).wait();
			}
			return avdInfo;
		}).future<Mobile.IAvdInfo>()();
	}

	private parseAvdFile(avdName: string, avdFileName: string, avdInfo: Mobile.IAvdInfo = null): IFuture<Mobile.IAvdInfo> {
		return (() => {
			// avd files can have different encoding, defined on the first line.
			// find which one it is (if any) and use it to correctly read the file contents
			var encoding = this.getAvdEncoding(avdFileName).wait();
			var contents = this.$fs.readText(avdFileName, encoding).wait().split("\n");

			avdInfo = _.reduce(contents, (result: Mobile.IAvdInfo, line:string) => {
				var parsedLine = line.split("=");
				var key = parsedLine[0];
				switch(key) {
					case "target":
						result.target = parsedLine[1];
						result.targetNum = this.readTargetNum(result.target);
						break;
					case "path": result.path = parsedLine[1]; break;
					case "hw.device.name": result.device = parsedLine[1]; break;
					case "abi.type": result.abi = parsedLine[1]; break;
					case "skin.name": result.skin = parsedLine[1]; break;
					case "sdcard.size": result.sdcard = parsedLine[1]; break;
				}
				return result;
			},
			avdInfo  || <Mobile.IAvdInfo>Object.create(null));
			avdInfo.name = avdName;
			return avdInfo;
		}).future<Mobile.IAvdInfo>()();
	}

	// Android L is not written as a number in the .ini files, and we need to convert it
	private readTargetNum(target: string): number {
		var platform = target.replace('android-', '');
		var platformNumber = +platform;
		if (isNaN(platformNumber)) {
			if (platform === "L") {
				platformNumber = 20;
			}
		}
		return platformNumber;
	}

	private getAvdEncoding(avdName: string): IFuture<any> {
		return (() => {
			// avd files can have different encoding, defined on the first line.
			// find which one it is (if any) and use it to correctly read the file contents
			var encoding = "utf8";
			var contents = this.$fs.readText(avdName, "ascii").wait();
			if (contents.length > 0) {
				contents = contents.split("\n", 1)[0];
				if (contents.length > 0) {
					var matches = contents.match(EmulateCommand.ENCODING_MASK);
					if(matches) {
						encoding = matches[1];
					}
				}
			}
			return encoding;
		}).future<any>()();
	}

	private get androidHomeDir(): string {
		return path.join(osenv.home(), EmulateCommand.ANDROID_DIR_NAME);
	}

	private get avdDir(): string {
		return path.join(this.androidHomeDir, EmulateCommand.AVD_DIR_NAME);
	}

	private getAvds(): IFuture<string[]> {
		return (() => {
			var result:string[] = [];
			if (this.$fs.exists(this.avdDir).wait()) {
				var entries = this.$fs.readDirectory(this.avdDir).wait();
				result = _.select(entries, (e: string) => e.match(EmulateCommand.INI_FILES_MASK) !== null)
						.map((e) => e.match(EmulateCommand.INI_FILES_MASK)[1]);
			}
			return result;
		}).future<string[]>()();
	}
}
$injector.register("emulate", EmulateCommand);

helpers.registerCommand("emulate", "emulate|android", (emulateCommand, args) => emulateCommand.runAndroid(args));
helpers.registerCommand("emulate", "emulate|ios",     (emulateCommand, args) => emulateCommand.runIos(args));
helpers.registerCommand("emulate", "emulate|wp8",     (emulateCommand, args) => emulateCommand.runWp8(args));

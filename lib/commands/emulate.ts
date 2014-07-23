///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Future = require("fibers/future");
import minimatch = require("minimatch");
var iconv = require("iconv-lite");
import helpers = require("../helpers");
import MobileHelper = require("../mobile/mobile-helper");
import constants = require("../mobile/constants");

class AndroidPlatformServices implements IEmulatorPlatformServices {
	constructor(private $logger: ILogger
		,private $project: Project.IProject
		,private $errors: IErrors
		,private $childProcess: IChildProcess) {}

	checkAvailability(): IFuture<void> {
		return (() => {
			if (!_.contains(this.$project.projectTargets.wait(), "android")) {
				this.$errors.fail("The current project does not target android and cannot be run in the Android emulator.");
			}
		}).future<void>()();
	}

	run(image: string) : IFuture<void> {
		return (() => {
			this.$logger.info("Starting emulator (Android)...");
			var childProcess = this.$childProcess.spawn('emulator', ['-avd', image],
				{ stdio:  ["ignore", "ignore", "ignore"], detached: true });
			childProcess.unref();
		}).future<void>()();
	}
}
$injector.register("android", AndroidPlatformServices);

class IosPlatformServices implements IEmulatorPlatformServices {
	constructor(private $logger: ILogger
		,private $project: Project.IProject
		,private $errors: IErrors
		,private $childProcess: IChildProcess) {}

	checkAvailability(): IFuture<void> {
		return (() => {
			if (!_.contains(this.$project.projectTargets.wait(), "ios")) {
				this.$errors.fail("The current project does not target iOS and cannot be run in the iOS Simulator.");
			}
			if (!helpers.isDarwin()) {
				this.$errors.fail("iOS Simulator is available only on Mac OS X.");
			}
		}).future<void>()();
	}

	run(image: string) : IFuture<void> {
		return (() => {
			this.$logger.info("Starting emulator (iOS)...");
			var childProcess = this.$childProcess.spawn(IosPlatformServices.IOS_SIM, ["launch", image],
				{ stdio:  ["ignore", "ignore", "ignore"], detached: true });
			childProcess.unref();
		}).future<void>()();
	}

	private static IOS_SIM = "ios-sim";
}
$injector.register("ios", IosPlatformServices);

class Wp8PlatformServices implements IEmulatorPlatformServices {
	constructor(private $logger: ILogger
		,private $project: Project.IProject
		,private $errors: IErrors
		,private $childProcess: IChildProcess) {}

	checkAvailability(): IFuture<void> {
		return (() => {
			if (!_.contains(this.$project.projectTargets.wait(), "wp8")) {
				this.$errors.fail("The current project does not target Windows Phone 8 and cannot be run in the Windows Phone emulator.");
			}
			if (!helpers.isWindows()) {
				this.$errors.fail("Windows Phone Emulator is available only on Windows 8 or later.");
			}
		}).future<void>()();
	}

	run(image: string) : IFuture<void> {
		return (() => {

		}).future<void>()();
	}
}
$injector.register("wp8", Wp8PlatformServices);

//	Name: Toshe
//	Device: Nexus 4 (Google)
//	Path: /Users/totev/.android/avd/Toshe.avd
//	Target: Android 4.4.2 (API level 19)
//	Tag/ABI: default/x86
//	Skin: WXGA800-7in
//	Sdcard: 128M

interface IEmulatorInfo {
	emulator: string;
}

interface IAvdInfo extends IEmulatorInfo {
	target: string;
	targetNum: number;
	path: string;
	device?: string;
	name?: string;
	abi?: string;
	skin?: string;
	sdcard?: string;
}

export class EmulateCommand {
	constructor(private $logger: ILogger
				,private $errors: IErrors
				,private $fs: IFileSystem
				,private $project: Project.IProject
				,private $projectTypes: IProjectTypes
				,private $buildService: Project.IBuildService
				,private $loginManager: ILoginManager
				,private $android: IEmulatorPlatformServices
				,private $ios: IEmulatorPlatformServices
				,private $wp8: IEmulatorPlatformServices
		) {
		this.$project.ensureProject();
		this.$loginManager.ensureLoggedIn().wait();
		iconv.extendNodeEncodings();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {

			if (args.length < 1 || args.length > 2) {
				this.$errors.fail("Please specify which emulator to start.");
			}

			if (args[0].toLowerCase() === 'android') {
				this.$android.checkAvailability().wait();

				var image: string = args[1] || this.getBestFit().wait();
				if (image) {
					this.$android.run(image).wait();
				} else {
					this.$errors.fail("Could not find an emulator image to run your project.");
				}
			} else if (args[0].toLowerCase() === 'ios') {
				this.$ios.checkAvailability().wait();

				var tempDir = this.createTempDir().wait();

				var packageDefs = this.$buildService.build({
					platform: "ios",
					configuration: "Debug",
					showQrCodes: false,
					downloadFiles: true,
					downloadedFilePath: path.join(tempDir, "package.zip"),
					provisionTypes: [constants.ProvisionType.AdHoc, constants.ProvisionType.Development],
					buildForiOSSimulator: true
				}).wait();

				this.$fs.unzip(packageDefs[0].localFile, tempDir).wait();

				var image = path.join(tempDir, this.$fs.readDirectory(tempDir).wait().filter(minimatch.filter("*.app"))[0]);
				this.$ios.run(image).wait();
			} else if (args[0].toLowerCase() === 'wp8') {
				this.$wp8.checkAvailability().wait();
				this.$wp8.run(null).wait(); // TODO
			}

		}).future<void>()();
	}

	private createTempDir(): IFuture<string> {
		return (() => {
			var dir = path.join(this.$project.getProjectDir(), ".ab");
			this.$fs.createDirectory(dir).wait();
			dir = path.join(dir, "simulatorfiles");
			this.$fs.createDirectory(dir).wait();
			return dir;
		}).future<string>()();
	}

	private static CORDOVA_REQURED_ANDROID_APILEVEL = 10; // 2.3 Gingerbread
	private static NATIVESCRIPT_REQURED_ANDROID_APILEVEL = 17; // 4.2 JellyBean

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

	private getInfoFromAvd(avdName: string): IFuture<IAvdInfo> {
		return (() => {
			var iniFile = path.join(this.avdDir, avdName + ".ini");
			var avdInfo: IAvdInfo = this.parseAvdFile(avdName, iniFile).wait();
			if (avdInfo.path && this.$fs.exists(avdInfo.path).wait()) {
				iniFile = path.join(avdInfo.path, "config.ini");
				avdInfo = this.parseAvdFile(avdName, iniFile, avdInfo).wait();
			}
			return avdInfo;
		}).future<IAvdInfo>()();
	}

	private parseAvdFile(avdName: string, avdFileName: string, avdInfo: IAvdInfo = null): IFuture<IAvdInfo> {
		return (() => {
			// avd files can have different encoding, defined on the first line.
			// find which one it is (if any) and use it to correctly read the file contents
			var encoding = this.getAvdEncoding(avdFileName).wait();
			var contents = this.$fs.readText(avdFileName, encoding).wait().split("\n");

			avdInfo = _.reduce(contents, (result: IAvdInfo, line) => {
				var parsedLine = line.split("=");
				var key = parsedLine[0];
				switch(key) {
					case "target":
						result.target = parsedLine[1];
						result.targetNum = +result.target.replace('android-', '');
						break;
					case "path": result.path = parsedLine[1]; break;
					case "hw.device.name": result.device = parsedLine[1]; break;
					case "abi.type": result.abi = parsedLine[1]; break;
					case "skin.name": result.skin = parsedLine[1]; break;
					case "sdcard.size": result.sdcard = parsedLine[1]; break;
				}
				return result;
			},
			avdInfo  || <IAvdInfo>Object.create(null));
			avdInfo.name = avdName;
			avdInfo.emulator = "Android";

			return avdInfo;
		}).future<IAvdInfo>()();
	}

	private getAvdEncoding(avdName: string): IFuture<any> {
		return (() => {
			// avd files can have different encoding, defined on te first line.
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

	private static ANDROID_DIR_NAME = ".android";
	private static AVD_DIR_NAME = "avd";
	private static INI_FILES_MASK = /^(.*)\.ini$/i;
	private static ENCODING_MASK = /^avd\.ini\.encoding=(.*)$/;

	private get userHome(): string {
		return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE; // works on mac/win. not tested on linux
	}

	private get androidHomeDir(): string {
		return path.join(this.userHome, EmulateCommand.ANDROID_DIR_NAME);
	}

	private get avdDir(): string {
		return path.join(this.androidHomeDir, EmulateCommand.AVD_DIR_NAME);
	}

	private getAvds(): IFuture<string[]> {
		return (() => {
			var result = [];
			if (this.$fs.exists(this.avdDir).wait()) {
				var entries = this.$fs.readDirectory(this.avdDir).wait();
				result = _.select(entries, (e: string) => e.match(EmulateCommand.INI_FILES_MASK) !== null)
						.map((e) => e.match(EmulateCommand.INI_FILES_MASK)[1]);
			}

			return result;
		}).future<string[]>()();
	}
}

$injector.registerCommand("emulate", EmulateCommand);

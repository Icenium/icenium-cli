///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import Fiber = require("fibers");
import Future = require("fibers/future");
import minimatch = require("minimatch");
import iconv = require("iconv-lite");
import os = require("os");
import osenv = require("osenv");
import helpers = require("../helpers");
import hostInfo = require("../host-info");
import MobileHelper = require("../mobile/mobile-helper");
import constants = require("../mobile/constants");

class AndroidPlatformServices implements IEmulatorPlatformServices {
	constructor(private $logger: ILogger
		,private $project: Project.IProject
		,private $errors: IErrors
		,private $childProcess: IChildProcess) {}

	public checkAvailability(): IFuture<void> {
		return (() => {
			if (!_.contains(this.$project.projectTargets.wait(), "android")) {
				this.$errors.fail("The current project does not target Android and cannot be run in the Android emulator.");
			}
		}).future<void>()();
	}

	public startEmulator(app: string, image?: string) : IFuture<void> {
		return (() => {
			// start the emulator, if needed
			var runningEmulators = this.getRunningEmulators().wait();
			if (runningEmulators.length === 0) {
				this.$logger.info("Starting Android emulator with image %s", image);
				this.$childProcess.spawn('emulator', ['-avd', image],
					{ stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
			}

			// adb does not always wait for the emulator to fully startup. wait for this
			while (runningEmulators.length === 0) {
				this.sleep(500);
				runningEmulators = this.getRunningEmulators().wait();
			}

			// install the app
			this.$logger.info("installing %s through adb", app);
			this.$childProcess.execFile('adb', ['-e', 'install', '-r', app]).wait();

			// run the installed app
			this.$logger.info("running %s through adb", app);
			this.$childProcess.spawn('adb', ['-e', 'shell', 'am', 'start', '-S', this.$project.projectData.AppIdentifier + "/.TelerikCallbackActivity"],
				{ stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
		}).future<void>()();
	}

	private sleep(ms: number): void {
		var fiber = Fiber.current;
		setTimeout(() => fiber.run(), ms);
		Fiber.yield();
	}

	private getRunningEmulators(): IFuture<string[]> {
		return (() => {
			var emulatorDevices: string[] = [];
			var outputRaw = this.$childProcess.execFile('adb', ['devices']).wait().split(os.EOL);
			_.each(outputRaw, (device: string) => {
				var rx = device.match(/^emulator-(\d+)\s+device$/);
				if (rx && rx[1]) {
					emulatorDevices.push(rx[1]);
				}
			});
			return emulatorDevices;
		}).future<string[]>()();
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
			if (!hostInfo.isDarwin()) {
				this.$errors.fail("iOS Simulator is available only on Mac OS X.");
			}
			if (!_.contains(this.$project.projectTargets.wait(), "ios")) {
				this.$errors.fail("The current project does not target iOS and cannot be run in the iOS Simulator.");
			}
		}).future<void>()();
	}

	startEmulator(image: string) : IFuture<void> {
		return (() => {
			this.$logger.info("Starting iOS Simulator");
			this.$childProcess.spawn(IosPlatformServices.SimulatorLauncher, ["launch", image],
				{ stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
		}).future<void>()();
	}

	private static SimulatorLauncher = "ios-sim";
}
$injector.register("ios", IosPlatformServices);

class Wp8PlatformServices implements IEmulatorPlatformServices {
	constructor(private $logger: ILogger
		,private $project: Project.IProject
		,private $errors: IErrors
		,private $childProcess: IChildProcess) {}

	checkAvailability(): IFuture<void> {
		return (() => {
			if (!hostInfo.isWindows()) {
				this.$errors.fail("Windows Phone Emulator is available only on Windows 8 or later.");
			}
			if (!_.contains(this.$project.projectTargets.wait(), "wp8")) {
				this.$errors.fail("The current project does not target Windows Phone 8 and cannot be run in the Windows Phone emulator.");
			}
		}).future<void>()();
	}

	startEmulator(image: string) : IFuture<void> {
		return (() => {
			this.$logger.info("Starting Windows Phone Emulator");
			var emulatorStarter = path.join (process.env.ProgramFiles, Wp8PlatformServices.WP8_LAUNCHER_PATH, Wp8PlatformServices.WP8_LAUNCHER);
			this.$childProcess.spawn(emulatorStarter, ["/installlaunch", image, "/targetdevice:xd"], { stdio:  ["ignore", "ignore", "ignore"], detached: true }).unref();
		}).future<void>()();
	}

	private static WP8_LAUNCHER = "XapDeployCmd.exe";
	private static WP8_LAUNCHER_PATH = "Microsoft SDKs\\Windows Phone\\v8.0\\Tools\\XAP Deployment";
}
$injector.register("wp8", Wp8PlatformServices);

interface IAvdInfo {
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
				,private $android: IEmulatorPlatformServices
				,private $ios: IEmulatorPlatformServices
				,private $wp8: IEmulatorPlatformServices) {
		iconv.extendNodeEncodings();
		this.$project.ensureProject();
		this.$loginManager.ensureLoggedIn().wait();
	}

	public runAndroid(args: string[]): IFuture<void> {
		return (() => {
			this.$android.checkAvailability().wait();

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
				this.$android.startEmulator(packageFilePath, image).wait();
			} else {
				this.$errors.fail("Could not find an emulator image to run your project.");
			}
		}).future<void>()();
	}

	public runIos(args: string[]): IFuture<void> {
		return (() => {
			this.$ios.checkAvailability().wait();

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
			this.$ios.startEmulator(app).wait();
		}).future<void>()();
	}

	public runWp8(args: string[]): IFuture<void> {
		return (() => {
			this.$wp8.checkAvailability().wait();

			var tempDir = this.createTempDir().wait();
			var packageFilePath = path.join(tempDir, "package.xap");
			var packageDefs = this.$buildService.build(<Project.IBuildSettings>{
				platform: MobileHelper.normalizePlatformName("WP8"),
				configuration: "Debug",
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			this.$wp8.startEmulator(packageFilePath).wait();
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

			avdInfo = _.reduce(contents, (result: IAvdInfo, line:string) => {
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
			avdInfo  || <IAvdInfo>Object.create(null));
			avdInfo.name = avdName;
			return avdInfo;
		}).future<IAvdInfo>()();
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

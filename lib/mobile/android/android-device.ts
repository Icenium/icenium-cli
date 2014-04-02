///<reference path="../../.d.ts"/>
import MobileHelper = require("./../mobile-helper");
import util = require("util");
import Future = require("fibers/future");
import path = require("path");
import byline = require("byline");
import helpers = require("./../../helpers");

interface IAndroidDeviceDetails {
	model: string;
	name: string
	release: string;
	brand: string;
}

export class AndroidDevice implements Mobile.IDevice {
	private static REFRESH_WEB_VIEW_INTENT_NAME = "com.telerik.RefreshWebView";
	private static CHANGE_LIVESYNC_URL_INTENT_NAME = "com.telerik.ChangeLiveSyncUrl";

	private model: string;
	private name: string;
	private version: string;
	private vendor: string;

	constructor(private identifier: string, private adb: string,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $errors: IErrors) {
		var details: IAndroidDeviceDetails = this.getDeviceDetails().wait();
		this.model = details.model;
		this.name = details.name;
		this.version = details.release;
		this.vendor = details.brand;
	}

	private getDeviceDetails(): IFuture<IAndroidDeviceDetails> {
		return (() => {
			var requestDeviceDetailsCommand = this.composeCommand("shell cat /system/build.prop");
			var details = this.$childProcess.exec(requestDeviceDetailsCommand).wait();
			details = details.split(/\r?\n|\r/);

			var parsedDetails: any = {};
			details.forEach((value) => {
				//sample line is "ro.build.version.release=4.4"
				var match = /(?:ro\.build\.version|ro\.product)\.(.+)=(.+)/.exec(value)
				if (match) {
					parsedDetails[match[1]] = match[2];
				}
			});

			return parsedDetails;
		}).future<IAndroidDeviceDetails>()();
	}

	public getPlatform(): string {
		return MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.Android];
	}

	public getIdentifier(): string {
		return this.identifier;
	}

	public getDisplayName(): string {
		return this.name;
	}

	public getModel(): string {
		return this.model;
	}

	public getVersion(): string {
		return this.version;
	}

	public getVendor(): string {
		return this.vendor;
	}

	private composeCommand(...args) {
		var command = util.format.apply(null, args);
		var result = util.format("\"%s\" -s %s", this.adb, this.identifier);
		if (command && !command.isEmpty()) {
			result += util.format(" %s", command);
		}

		return result;
	}

	private startPackageOnDevice(packageName): IFuture<void> {
		return(() => {
			var startPackageCommand = this.composeCommand("shell am start -a android.intent.action.MAIN -n %s/.TelerikCallbackActivity", packageName);
			var result = this.$childProcess.exec(startPackageCommand).wait();
			return result[0];
		}).future<void>()();
	}

	public deploy(packageFile: string, packageName: string): IFuture<void> {
		return(() => {
			var uninstallCommand = this.composeCommand("shell pm uninstall \"%s\"", packageName)
			this.$childProcess.exec(uninstallCommand).wait();

			var installCommand = this.composeCommand("install -r \"%s\"", packageFile);
			this.$childProcess.exec(installCommand).wait();

			this.startPackageOnDevice(packageName).wait();
			this.$logger.info("Successfully deployed on device with identifier '%s'", this.getIdentifier());
		}).future<void>()();
	}

	private pushFilesOnDevice(localToDevicePaths): IFuture<void> {
		return(() => {
			localToDevicePaths.forEach((localToDevicePathData) => {
				this.pushFileOnDevice(localToDevicePathData.getLocalPath(), localToDevicePathData.getDevicePath()).wait();
			});
		}).future<void>()();
	}

	private pushFileOnDevice(localPath: string, devicePath: string): IFuture<void> {
		return(() => {
			var rmCommand = this.composeCommand('shell rm -r "%s"', devicePath);
			this.$childProcess.exec(rmCommand).wait();

			if (this.$fs.exists(localPath).wait()) {
				var isDirectory = this.$fs.getFsStats(localPath).wait().isDirectory();

				var mkdirCommand = this.composeCommand('shell mkdir -p "%s"', isDirectory ? devicePath : path.dirname(devicePath));
				this.$childProcess.exec(mkdirCommand).wait();

				var pushFileCommand = this.composeCommand('push "%s" "%s"', isDirectory ? path.join(localPath, ".") : localPath, devicePath);
				this.$childProcess.exec(pushFileCommand).wait();
			}
		}).future<void>()();
	}

	public sendBroadcastToDevice(action, extras = {}): IFuture<number> {
		return (() => {
			var broadcastCommand = this.composeCommand("shell am broadcast -a \"%s\"", action);

			Object.keys(extras).forEach((key) => {
				broadcastCommand += util.format(" -e \"%s\" \"%s\"", key, extras[key]);
			});

			var result = this.$childProcess.exec(broadcastCommand).wait();
			var match = result.match(/Broadcast completed: result=(\d+)/);
			if (match) {
				return +match[1];
			} else {
				this.$errors.fail("Unable to broadcast to android device:\n%s", result);
			}
		}).future<number>()();
	}

	public sync(localToDevicePaths: Mobile.ILocalToDevicePathData[], appIdentifier: Mobile.IAppIdentifier, options: Mobile.ISyncOptions = {}): IFuture<void> {
		return (() => {
			if (appIdentifier.isLiveSyncSupported(this).wait()) {
				this.pushFilesOnDevice(localToDevicePaths).wait();
				if (!options.skipRefresh) {
					this.sendBroadcastToDevice(AndroidDevice.CHANGE_LIVESYNC_URL_INTENT_NAME, {liveSyncUrl: "icenium://"}).wait();
					this.sendBroadcastToDevice(AndroidDevice.REFRESH_WEB_VIEW_INTENT_NAME).wait();
				}
				this.$logger.info("Successfully synced device with identifier '%s'", this.getIdentifier());
			} else {
				this.$errors.fail({formatStr: "You can't live sync on %s! Deploy the app with live sync enabled and wait for the initial start up before live syncing.", suppressCommandHelp: true }, this.identifier);
			}
		}).future<void>()();
	}

	openDeviceLogStream() {
		var adbLogcat = this.$childProcess.spawn(this.adb, ["-s", this.getIdentifier(), "logcat"]);
		var lineStream = byline(adbLogcat.stdout);

		adbLogcat.stderr.on("data", function (data) {
			this.$logger.trace("ADB logcat stderr: " + data);
		});

		adbLogcat.on("close", (code) => {
			if (code !== 0) {
				this.$logger.trace("ADB process exited with code " + code);
			}
		});

		lineStream.on('data', (line) => {
			var lineText = line.toString();
			var log = this.getConsoleLogFromLine(lineText);
			if (log) {
				if (log.tag) {
					this.$logger.out("%s: %s", log.tag, log.message);
				} else {
					this.$logger.out(log.message);
				}
			}
		});
	}

	private getConsoleLogFromLine(lineText: String): any {
		var acceptedTags = ["chromium", "Web Console"];

		//sample line is "I/Web Console(    4438): Received Event: deviceready at file:///storage/emulated/0/Icenium/com.telerik.TestApp/js/index.js:48"
		var match = lineText.match(/.\/(.+?)\(\s*(\d+?)\): (.*)/);
		if (match) {
			if (acceptedTags.indexOf(match[1]) !== -1) {
				return { tag: match[1], message: match[3] };
			}
		}
		else if (_.any(acceptedTags, (tag) => { return lineText.indexOf(tag) !== -1; })) {
			return { message: match[3] };
		}

		return null;
	}
}

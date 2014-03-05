///<reference path="../../.d.ts"/>
import MobileHelper = require("./../mobile-helper");
import util = require("util");
import Future = require("fibers/future");
import path = require("path");
import helpers = require("./../../helpers");

export class AndroidDevice implements Mobile.IDevice {
	private static PROJECT_PATH = "mnt/sdcard/Icenium/";
	private static REFRESH_WEB_VIEW_INTENT_NAME = "com.telerik.RefreshWebView";

	constructor(private identifier: string,
		private adb: string,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $errors: IErrors) {
	}

	getPlatform(): string {
		return MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.Android].toLowerCase();
	}

	getIdentifier(): string {
		return this.identifier;
	}

	getDisplayName(): string {
		return this.identifier;
	}

	public getDeviceProjectPath(appIdentifier: string): string {
		return path.join(AndroidDevice.PROJECT_PATH, appIdentifier);
	}

	private composeCommand(command) {
		var result = util.format("\"%s\" -s %s", this.adb, this.identifier);
		if (command && !command.isEmpty()) {
			result += util.format(" %s", command);
		}

		return result;
	}

	private startPackageOnDevice(packageName): IFuture<void> {
		return(() => {
			var startPackageCommand = this.composeCommand(util.format("shell am start -a android.intent.action.MAIN -n %s/.TelerikCallbackActivity", packageName));
			var result = this.$childProcess.exec(startPackageCommand).wait();
			return result[0];
		}).future<void>()();
	}

	public deploy(packageFile: string, packageName: string): IFuture<void> {
		return(() => {
			var uninstallCommand = this.composeCommand(util.format("shell pm uninstall \"%s\"", packageName))
			this.$childProcess.exec(uninstallCommand).wait();

			var installCommand = this.composeCommand(util.format("install -r \"%s\"", packageFile));
			this.$childProcess.exec(installCommand).wait();

			this.startPackageOnDevice(packageName).wait();
			console.log("Successfully deployed on device with identifier '%s'", this.getIdentifier());
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
			var pushFileCommand = this.composeCommand(util.format("push \"%s\" \"%s\"", localPath, devicePath));
			this.$childProcess.exec(pushFileCommand).wait();
		}).future<void>()();
	}

	private sendBroadcastToDevice(action): Future<void> {
		return(() => {
			var broadcastCommand = this.composeCommand(util.format("shell am broadcast -a \"%s\"", action));
			this.$childProcess.exec(broadcastCommand).wait();
		}).future<void>()();
	}

	sync(localToDevicePaths: Mobile.ILocalToDevicePathData[], appIdentifier: string): IFuture<void> {
		return(() => {
			this.pushFilesOnDevice(localToDevicePaths).wait();
			this.sendBroadcastToDevice(AndroidDevice.REFRESH_WEB_VIEW_INTENT_NAME).wait();
			console.log("Successfully synced device with identifier '%s'", this.getIdentifier());
		}).future<void>()();
	}

	openDeviceLogStream() {
		var adbLogcat = this.$childProcess.spawn(this.adb, ["-s", this.getIdentifier(), "logcat"]);
		var search = this.spawnTextSearch(["telerik","icenium"]);

		adbLogcat.stdout.on("data", (data) => {
			search.stdin.write(data);
		});

		adbLogcat.stderr.on("data", function (data) {
			this.$logger.trace("ADB logcat stderr: " + data);
		});

		adbLogcat.on("close", (code) => {
			if (code !== 0) {
				this.$logger.trace("ADB process exited with code " + code);
			}
			search.stdin.end();
		});

		search.stdout.on("data", (data) => {
			this.$logger.out(data.toString());
		});

		search.stderr.on("data", (data) => {
			this.$logger.trace("text search process stderr: " + data);
		});

		search.on("close", (code) => {
			if (code !== 0) {
				this.$logger.trace("text search process exited with code " + code);
			}
		});
	}

	private spawnTextSearch(keywords: string[]) {
		if (!keywords || keywords.length == 0) {
			this.$errors.fail("To spawn a text search process you must provide keywords and filter by them.");
		}

		if (helpers.isWindows()) {
			// /r :Uses search strings as regular expressions. Findstr interprets all metacharacters as regular expressions.
			// /i :Specifies that the search is not to be case-sensitive.
			return this.$childProcess.spawn("findstr", ["/r", "/i", keywords.join(" ")]);
		} else {
			// -E :Interpret PATTERN as an extended regular expression.
			// -i :Ignore case distinctions in both the PATTERN and the input.
			return this.$childProcess.spawn("grep", ["-E", "-i", keywords.join("|")]);
		}
	}
}

///<reference path="../../.d.ts"/>
import MobileHelper = require("./../mobile-helper");
import util = require("util");
import Future = require("fibers/future");
import child_process = require("child_process");
import path = require("path");
import helpers = require("./../../helpers");

export class AndroidDevice implements Mobile.IDevice {
	private projectPath = "mnt/sdcard/Icenium/";
	private refreshWebViewIntentName = "com.telerik.RefreshWebView";
	private exec = Future.wrap( (command: string, callback: (error: any, stdout: NodeBuffer) => void) => {
		return child_process.exec(command, callback);
	});

	constructor(private identifier: string,
				private adb: string,
				private logger: ILogger) {
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
		return path.join(this.projectPath, appIdentifier);
	}

	private composeCommand(command) {
		var result = util.format("%s -s %s", this.adb, this.identifier);
		if (command && !command.isEmpty()) {
			result += util.format(" %s", command);
		}
		return result;
	}

	private startPackageOnDevice(packageName) {
		var startPackageCommand = this.composeCommand(util.format("shell am start -a android.intent.action.MAIN -n %s/.TelerikCallbackActivity", packageName));
		var result = this.exec(startPackageCommand).wait();
		return result[0];
	}

	deploy(packageFile: string, packageName: string): void {
		var installCommand = this.composeCommand(util.format("install -r %s", packageFile));
		this.exec(installCommand).wait();
		this.startPackageOnDevice(packageName);
		console.log("Successfully deployed on device with identifier '%s'", this.getIdentifier());
	}

	private pushFilesOnDevice(localToDevicePaths): IFuture<void> {
		return(() => {
			var transferers: IFuture<any>[] = [];
			localToDevicePaths.forEach((localToDevicePathData) => {
				transferers.push(this.pushFileOnDevice(localToDevicePathData.getLocalPath(), localToDevicePathData.getDevicePath()));
			});
			Future.wait(transferers);
		}).future<void>()();
	}


	private pushFileOnDevice(localPath: string, devicePath: string): IFuture<any> {
		return(() => {
			var pushFileCommand = this.composeCommand(util.format("push %s %s", localPath, devicePath));
			var result = this.exec(pushFileCommand).wait();
		}).future<any>()();
	}

	private sendBroadcastToDevice(action): Future<void> {
		return(() => {
			var broadcastCommand = this.composeCommand(util.format("shell am broadcast -a \"%s\"", action));
			var result = this.exec(broadcastCommand).wait();
		}).future<void>()();
	}

	sync(localToDevicePaths: Mobile.ILocalToDevicePathData[], appIdentifier: string): void {
		this.pushFilesOnDevice(localToDevicePaths).wait();
		this.sendBroadcastToDevice(this.refreshWebViewIntentName).wait();
		console.log("Successfully synced device with identifier '%s'", this.getIdentifier());
	}

	openDeviceLogStream() {
		var adbLogcat = child_process.spawn(this.adb, ["-s", this.getIdentifier(), "logcat"]);
		var grep = child_process.spawn("grep", ["-E", "-i", "telerik|icenium"]);

		adbLogcat.stdout.on("data", function (data) {
			grep.stdin.write(data);
		});

		adbLogcat.stderr.on("data", function (data) {
			this.logger.trace("ADB logcat stderr: " + data);
		});

		adbLogcat.on("close", function (code) {
			if (code !== 0) {
				this.logger.trace("ADB process exited with code " + code);
			}
			grep.stdin.end();
		});

		grep.stdout.on("data", function (data) {
			var content = data.toString();
			console.log(data.toString());
		});

		grep.stderr.on("data", function (data) {
			this.logger.trace("grep stderr: " + data);
		});

		grep.on("close", function (code) {
			if (code !== 0) {
				this.logger.trace("grep process exited with code " + code);
			}
		});
	}
}

$injector.register("androidDevice", AndroidDevice);
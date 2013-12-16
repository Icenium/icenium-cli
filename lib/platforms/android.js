(function() {
	"use strict";
	require("../extensions");
	var child_process = require("child_process"),
		spawn = require("child_process").spawn,
		endOfLine = require("os").EOL,
		Q = require("q"),
		path = require("path"),
		log = require("../log"),
		util = require("util");

	var adb = path.join(__dirname, "../../", "/resources/platform-tools/android/adb");
	var refreshWebViewIntentName = "com.telerik.RefreshWebView";
	var projectPath = "mnt/sdcard/Icenium/";

	function hasDevices() {
		return requestAllDevices()
			.then(function(devices) {
				return devices.length > 0;
			});
	}

	function requestDeviceById(deviceId) {
		var noDeviceErrorMessage = util.format("There isn't a device with %s", deviceId.index || deviceId.serialNumber);

		if (deviceId.index && deviceId.index <= 0) {
			throw new Error(noDeviceErrorMessage);
		}

		return requestAllDevices()
			.then(function (devices) {
				var deviceSerialNumber = getDeviceSerialNumber(devices, deviceId);
				if (deviceSerialNumber) {
					return deviceSerialNumber;
				} else {
					throw new Error(noDeviceErrorMessage);
				}
			});
	}

	function requestAllDevices() {
		var requestAllDevicesCommand = util.format("%s devices", adb);

		return Q.ninvoke(child_process, "exec", requestAllDevicesCommand)
			.then(function (result) {
				var devices = filterDevices(result[0]);
				return devices;
			});
	}

	function filterDevices(devices) {
		return devices.split(endOfLine).slice(1)
			.filter(function (element) {
				return element && !element.isEmpty();
			})
			.map(function (element) {
				return element.split("\t")[0];
			});
	}

	function getDeviceSerialNumber(devices, deviceId) {
		if (deviceId.index && deviceId.index > 0) {
			if (devices.length >= deviceId.index) {
				return devices[deviceId.index - 1];
			}
		} else if (deviceId.serialNumber) {
			if (devices.contains(deviceId.serialNumber)) {
				return deviceId.serialNumber;
			}
		}
		return null;
	}

	function isPackageInstalledOnDevice(deviceSerialNumber, packageName) {
		var isPackageInstalledCommand = composeCommand(deviceSerialNumber, util.format("shell pm list packages %s", packageName));

		return Q.ninvoke(child_process, "exec", isPackageInstalledCommand)
			.then(function (result) {
				var stdout = result[0];
				return stdout.indexOf(packageName) >= 0;
			});
	}

	function startPackageOnDevice(deviceSerialNumber, packageName) {
		var startPackageCommand = composeCommand(deviceSerialNumber,
			util.format("shell am start -a android.intent.action.MAIN -n %s/.TelerikCallbackActivity", packageName));

		return Q.ninvoke(child_process, "exec", startPackageCommand)
			.then(function (result) {
				var stdout = result[0];
				return stdout;
			});
	}

	function install(packageFile, packageName) {
		return requestAllDevices()
			.then(function(devices) {
				return installPackage(devices, packageFile, packageName);
			});
	}

	function installPackage(devices, packageFile, packageName) {
		var installers = [];
		devices.forEach(function (device) {
			installers.push(installPackageOnDevice(device, packageFile, packageName));
		});

		return Q.all(installers);
	}

	function installPackageOnDevice(deviceSerialNumber, packageFile, packageName) {
		var installCommand = composeCommand(deviceSerialNumber, util.format("install -r %s", packageFile));

		return Q.ninvoke(child_process, "exec", installCommand)
			.then(function () {
				return startPackageOnDevice(deviceSerialNumber, packageName);
			});
	}

	function uninstallPackageFromAllDevices(packageName) {
		return requestAllDevices()
			.then(function(devices) {
				return uninstallPackage(devices, packageName);
			});
	}

	function uninstallPackage(devices, packageName) {
		var uninstallers = [];
		devices.forEach(function (device) {
			uninstallers.push(uninstallPackageFromDevice(device, packageName));
		});

		return Q.all(uninstallers);
	}

	function uninstallPackageFromDevice(deviceSerialNumber, packageName) {
		var uninstallCommand = composeCommand(deviceSerialNumber, util.format("shell pm uninstall %s", packageName));

		return Q.ninvoke(child_process, "exec", uninstallCommand)
			.then(function (result) {
				var stdout = result[0];
				return stdout;
			});
	}

	function sync(localToDevicePaths, device) {
		if (device) {
			return syncDevices(localToDevicePaths, [device]);
		} else {
			return requestAllDevices()
				.then(function(devices) {
					return syncDevices(localToDevicePaths, devices);
				});
		}
	}

	function syncDevices(localToDevicePaths, devices) {
		var filePushers = [];
		devices.forEach(function (device) {
			var filePusher = pushFilesOnDevice(device, localToDevicePaths)
				.then(refreshWebView);
			filePushers.push(filePusher);
		});

		return Q.all(filePushers);
	}

	function pushFilesOnDevice(deviceSerialNumber, localToDevicePaths) {
		var transferers = [];
		localToDevicePaths.forEach(function (data) {
			transferers.push(pushFileOnDevice(deviceSerialNumber, data.localPath, data.devicePath)
				.catch(function (error) {
					log.trace(error);
				}));
		});

		return Q.all(transferers)
			.then(function () {
				return deviceSerialNumber;
			});
	}

	function pushFileOnDevice(deviceSerialNumber, localPath, devicePath) {
		var pushFileCommand = composeCommand(deviceSerialNumber, util.format("push %s %s", localPath, devicePath));

		return Q.ninvoke(child_process, "exec", pushFileCommand)
			.then(function (result) {
				var stdout = result[0];
				return {device: deviceSerialNumber, result: stdout};
			});
	}

	function refreshWebView(deviceSerialNumber) {
		return sendBroadcastToDevice(deviceSerialNumber, refreshWebViewIntentName);
	}

	function sendBroadcastToDevice(deviceSerialNumber, action) {
		var broadcastCommand = composeCommand(deviceSerialNumber,
			util.format("shell am broadcast -a \"%s\"", action));

		return Q.ninvoke(child_process, "exec", broadcastCommand)
			.then(function (result) {
				var stdout = result[0];
				return stdout;
			});
	}

	function openLogStream(deviceSerialNumber, callback) {
		var adbLogcat = spawn(adb, ["-s", deviceSerialNumber, "logcat"]);
		var grep = spawn("grep", ["-E", "-i", "telerik|icenium"]);

		adbLogcat.stdout.on("data", function (data) {
			grep.stdin.write(data);
		});

		adbLogcat.stderr.on("data", function (data) {
			log.trace("ADB logcat stderr: " + data);
			callback(data);
		});

		adbLogcat.on("close", function (code) {
			if (code !== 0) {
				log.trace("ADB process exited with code " + code);
			}
			grep.stdin.end();
		});

		grep.stdout.on("data", function (data) {
			var content = data.toString();
			callback(null, content);
		});

		grep.stderr.on("data", function (data) {
			log.trace("grep stderr: " + data);
			callback(data);
		});

		grep.on("close", function (code) {
			if (code !== 0) {
				log.trace("grep process exited with code " + code);
			}
		});
	}

	function composeCommand(deviceSerialNumber, command) {
		var result = util.format("%s -s %s", adb, deviceSerialNumber);
		if (command && !command.isEmpty()) {
			result += util.format(" %s", command);
		}
		return result;
	}

	function getDeviceProjectPath(appIdentifier) {
		var deviceProjectPath = path.join(projectPath, appIdentifier);
		return deviceProjectPath;
	}

	function getPlatformName() {
		return "android";
	}

	exports.hasDevices = hasDevices;
	exports.requestAllDevices = requestAllDevices;
	exports.requestDeviceById = requestDeviceById;
	exports.install = install;
	exports.uninstallPackageFromAllDevices = uninstallPackageFromAllDevices;
	exports.sync = sync;
	exports.openLogStream = openLogStream;
	exports.getDeviceProjectPath = getDeviceProjectPath;
	exports.getPlatformName = getPlatformName;
}());
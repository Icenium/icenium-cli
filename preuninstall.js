var child_process = require("child_process");
var util = require("util");

var adbPath = process.platform === "win32" ? "resources/platform-tools/android/windows/adb.exe" : "resources/platform-tools/android/osx/adb";
var killAdbServerCommand = util.format("\"%s\" %s", adbPath, " kill-server");

child_process.exec(killAdbServerCommand, function(error) {
	if(error) {
		console.log(error.toString());
	}
});
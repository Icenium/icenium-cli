var child_process = require("child_process");
var util = require("util");
var path = require("path");
var fs = require("fs");
var options = require("./lib/options");

var adbPath = process.platform === "win32" ? "resources/platform-tools/android/windows/adb.exe" : "resources/platform-tools/android/osx/adb";
var killAdbServerCommand = util.format("\"%s\" %s", adbPath, " kill-server");

child_process.exec(killAdbServerCommand, function(error) {
	if(error) {
		console.log(error.toString());
	}
});

fs.unlink(path.join(options["profile-dir"], "KillSwitches/cli"), function(err) {
	if (!err) {
		setTimeout(function(){}, 3000);
	}
});

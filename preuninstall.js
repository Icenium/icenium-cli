var child_process = require("child_process");
var util = require("util");
var path = require("path");
var fs = require("fs");
var options = require("./lib/options");

var adbPath = util.format("resources/platform-tools/android/%s/adb", process.platform);
var executableAdbPath = process.platform === "win32" ? adbPath + ".exe" : adbPath;
if(!fs.existsSync(executableAdbPath)) {
	adbPath = "lib/common/" + adbPath;
}

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

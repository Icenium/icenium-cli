var skipPostinstallTasks = process.env["APPBUILDER_SKIP_POSTINSTALL_TASKS"];
if (skipPostinstallTasks) {
	return;
}

var fs = require("fs"),
	path = require("path"),
	child_process = require("child_process");

function invokeGrunt(callback) {
	if (!fs.existsSync("lib/version-validator.js")) {
		var grunt = require("grunt");
		grunt.cli.tasks = ["ts:devall"];
		grunt.cli(null, callback);
	} else {
		process.nextTick(callback);
	}
}

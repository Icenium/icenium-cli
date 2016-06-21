var skipPostinstallTasks = process.env["APPBUILDER_SKIP_POSTINSTALL_TASKS"];
if (skipPostinstallTasks) {
	return;
}

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");

function invokeGrunt(callback) {
	if (!fs.existsSync("lib/appbuilder-cli.js")) {
		var grunt = require("grunt");
		grunt.cli.tasks = ["ts:devall"];
		grunt.cli(null, callback);
	} else {
		process.nextTick(callback);
	}
}

invokeGrunt(function () {
	var child = child_process.exec("node bin/appbuilder.js dev-prepackage", { env: process.env }, function (error) {
		if (error) {
			console.error("Failed to complete all pre-publishing steps.");
			throw error;
		}
	});

	child.stdout.pipe(process.stdout);
});

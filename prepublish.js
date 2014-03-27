var fs = require("fs");
var path = require("path");
var child_process = require("child_process");

function invokeGrunt(callback) {
	if (fs.existsSync("Gruntfile.js") && !fs.existsSync("lib/appbuilder-cli.js")) {
		var grunt = require("grunt");
		grunt.cli.options.color = false;
		grunt.cli(null, callback);
	} else {
		process.nextTick(callback);
	}
}

invokeGrunt(function() {
	var child = child_process.exec("node bin/appbuilder.js dev-prepackage", function (error) {
		if (error) {
			console.error("Failed to complete all pre-packaging steps.");
			throw error;
		}
	});

	child.stdout.pipe(process.stdout);
});

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");

function invokeGrunt(callback) {
	if (!fs.existsSync("lib/appbuilder-cli.js")) {
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
			// don't rethrow if this step fails as part running 'npm install' in a Jenkins job,

			var doThrow = true;
			if (process.env["JOB_NAME"]) {
				var argv = JSON.parse(process.env["npm_config_argv"]);
				if (argv.cooked[0] && argv.cooked[0].toLowerCase() === "install") {
					doThrow = false;
				}
			}

			if (doThrow) {
				console.error("Failed to complete all pre-publishing steps.");
				throw error;
			}
		}
	});

	child.stdout.pipe(process.stdout);
});

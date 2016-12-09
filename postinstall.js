"use strict";

var shelljs = require("shelljs"),
	path = require("path"),
	child_process = require("child_process"),
	nodeArgs = require("./lib/common/scripts/node-args").getNodeArgs(),
	nodeModulesDirName = "node_modules",
	iosSimPortableDirName = "ios-sim-portable",
	fibersDirName = "fibers";

try {
	// In case there are fibers in ios-sim-portable's node_modules dir, we should remove them in order to make LiveSync work:
	var pathToIOSSimFibersModule = path.join(__dirname, nodeModulesDirName, iosSimPortableDirName, nodeModulesDirName, fibersDirName);
	shelljs.rm("-rf", pathToIOSSimFibersModule);
} catch (err) {
	// Ignore the error.
}

var skipPostinstallTasks = process.env["APPBUILDER_SKIP_POSTINSTALL_TASKS"];
if (skipPostinstallTasks) {
	return;
}

var commandArgs = ["bin/appbuilder", "dev-post-install"];

child_process.spawn(process.argv[0], nodeArgs.concat(commandArgs), {stdio: "inherit"});

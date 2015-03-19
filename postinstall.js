"use strict";
var skipPostinstallTasks = process.env["APPBUILDER_SKIP_POSTINSTALL_TASKS"];
if (skipPostinstallTasks) {
	return;
}

var child_process = require("child_process");
child_process.spawn(process.argv[0], ["bin/appbuilder.js", "dev-post-install"], {stdio: "inherit"});

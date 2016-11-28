var child_process = require("child_process"),
	nodeArgs = require("./lib/common/scripts/node-args").getNodeArgs();

var commandArgs = ["bin/appbuilder", " dev-preuninstall"];

var child = child_process.exec("node " + nodeArgs.concat(commandArgs).join(" "), function (error) {
	if (error) {
		console.error("Failed to complete all pre-uninstall steps. ");
		console.log(error);
	}
});

child.stdout.pipe(process.stdout);

setTimeout(function(){}, 3000);

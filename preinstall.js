var child_process = require("child_process");

function abort(message) {
	console.log("\x1b[34m" + message + "\x1b[0m");
	process.exit(20);
}

var pythonMessage = "Install the latest version of Python 2 (not Python 3) and make sure it is in the environment path.\n\n" +
	"For more information, review the requirements of node-gyp here:\n" +
	"https://github.com/TooTallNate/node-gyp#installation [Ctrl-Click]";

child_process.exec("python --version", function(error, stdout, stderr) {
	if (error) {
		abort("Python installation was not detected. " + pythonMessage);
	}

	var pythonVer = stderr;

	if (!/^Python 2\.[789]/.test(pythonVer)) {
		abort(pythonVer + " is not supported. " + pythonMessage);
	}
});

child_process.exec("git --version", function(error, stdout, stderr) {
	if (error) {
		abort("Git installation was not detected. Install the latest version of Git " +
			"for your platform and make sure it is in the environment path:\nhttp://git-scm.com/downloads [Ctrl-Click]");
	}
});

var fs = require("fs");
var path = require("path");
var child_process = require("child_process");

fs.chmod("resources/platform-tools/android/osx/adb", "755", function (err) {
	if (err) {
		throw err;
	}
});

var homeDir = process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH;

var scriptsOk = true;
var outstandingUpdates = 0;

function updateCallback(error) {
	if (error) {
		scriptsOk = false;
	}

	if (!--outstandingUpdates) {
		if (scriptsOk) {
			console.log("Restart your shell to enable command auto-completion.");
		} else {
			console.log("Failed to update all shell start-up scripts. Auto-completion may not work.");
		}
	}
}

function updateShellScript(fileName) {
	var filePath = path.join(homeDir, fileName);
	
	var doUpdate = true;
	if (fs.existsSync(filePath)) {
		var contents = fs.readFileSync(filePath).toString();
		if (contents.match(/appbuilder\s+completion\s+--\s+/)) {
			doUpdate = false;
		}
	}
	
	if (doUpdate) {
		outstandingUpdates++;
		child_process.exec("appbuilder completion >> " + filePath, updateCallback);
	}
}

// bash - http://www.gnu.org/software/bash/manual/bashref.html#Bash-Startup-Files
updateShellScript(".profile");
updateShellScript(".bashrc");

// zsh - http://www.acm.uiuc.edu/workshops/zsh/startup_files.html
updateShellScript(".zshrc");

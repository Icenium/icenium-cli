var readline = require("readline");

if (process.platform !== "win32") {
	return;
}

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

if (process.arch !== "ia32") {
	console.log("Install the 32-bit version of Node.js before installing AppBuilder CLI.");
	process.exit(1);
}

var info = [
	"Before proceeding with the installation, review that you have the following installed:",
	"",
	"* Python 2.7.x - http://www.python.org/ftp/python/",
	"* Git for Windows - http://code.google.com/p/msysgit/downloads/",
	"* Visual Studio 2010/2012/2013 (with C++ compiler installed) or Windows 7 Platform SDK",
	""
];

console.log(info.join("\n"));

rl.question("Press ENTER to proceed with the installation.", function(answer) {
	rl.close();
});

var fs = require("fs");

fs.chmod("resources/platform-tools/android/osx/adb", "755", function (err) {
	if (err) {
		throw err;
	}
});

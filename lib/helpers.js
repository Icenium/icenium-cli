"use strict";

(function() {
	var fs = require("fs"),
		path = require("path");


	function enumerateFilesInDirectorySyncRecursive(foundFiles, directoryPath, filterCallback) {
		var contents = fs.readdirSync(directoryPath);
		for (var i = 0; i < contents.length; ++i) {
			var file = path.join(directoryPath, contents[i]);
			var stat = fs.statSync(file);
			if (!filterCallback(file, stat)) {
				continue;
			}

			if (stat.isDirectory()) {
				enumerateFilesInDirectorySyncRecursive(foundFiles, file, filterCallback);
			} else {
				foundFiles.push(file);
			}
		}
	}

	// filterCallback: function(path: String, stat: fs.Stats): Boolean
	function enumerateFilesInDirectorySync(directoryPath, filterCallback) {
		var result = [];
		enumerateFilesInDirectorySyncRecursive(result, directoryPath, filterCallback);
		return result;
	}


	exports.enumerateFilesInDirectorySync = enumerateFilesInDirectorySync;

	exports.nop = function() {
		return 123;
	};

})();

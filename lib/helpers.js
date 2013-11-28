"use strict";

(function() {
	var fs = require("fs"),
		path = require("path"),
		util = require("util"),
		querystring = require("querystring"),
		log = require("./log"),
		config = require("./config");

	function enumerateFilesInDirectorySyncRecursive(foundFiles, directoryPath, filterCallback) {
		var contents = fs.readdirSync(directoryPath);
		for (var i = 0; i < contents.length; ++i) {
			var file = path.join(directoryPath, contents[i]);
			var stat = fs.statSync(file);
			if (filterCallback && !filterCallback(file, stat)) {
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

	function ensureString(string, position) {
		if (typeof string !== "string") {
			throw new Error(util.format("Expected string as argument at position %d but got '%s'", position, util.inspect(string)));
		}
	}

	function ensureArray(array, position) {
		if (Object.prototype.toString.call(array) !== "[object Array]") {
			throw new Error(util.format("Expected array as argument at position %d but got '%s'", position, util.inspect(array)));
		}
	}

	function ensureCallback(callback, position) {
		if (typeof callback !== "function") {
			throw new Error(util.format("Expected callback as argument at position %d but got '%s'", position, util.inspect(callback)));
		}
	}

	function createQrUrl(data) {
		return util.format("http://api.qrserver.com/v1/create-qr-code/?size=%dx%d&qzone=4&data=%s",
			config.QR_SIZE, config.QR_SIZE, querystring.escape(data));
	}


	//TODO: try 'archiver' module for zipping
	function zipFiles(zipFile, files, zipPathCallback, callback) {
		ensureString(zipFile, 0);
		ensureArray(files, 1);
		ensureCallback(callback, 2);
		ensureCallback(callback, 3);

		var zipstream = require("zipstream");
		var zip = zipstream.createZip({level: 9});
		var outFile = fs.createWriteStream(zipFile);
		zip.pipe(outFile);

		var fileIdx = -1;
		var zipCallback = function() {
			fileIdx++;
			if (fileIdx < files.length) {
				var file = files[fileIdx];

				var relativePath = zipPathCallback(file);
				relativePath = relativePath.replace(/\\/g, "/");
				log.trace("zipping as '%s' file '%s'", relativePath, file);
				
				zip.addFile(
					fs.createReadStream(file),
					{name: relativePath},
					zipCallback);
			} else {
				outFile.on("finish", function() {
					callback(null);
				});

				zip.finalize(function(bytesWritten) {
					log.debug("zipstream: %d bytes written", bytesWritten);
					outFile.end();
				});
			}
		};
		zipCallback();
	}

	function isRequestSuccessful(request) {
		return request.statusCode >= 200 && request.statusCode < 300;
	}

	function isAndroidPlatform(platform) {
		return platform.toLowerCase() === "android";
	}

	function isiOSPlatform(platform) {
		return platform.toLowerCase() === "ios";
	}

	function getRelativeToRootPath(rootPath, filePath) {
		var relativeToRootPath = filePath.substr(rootPath.length);
		return relativeToRootPath;
	}

	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	exports.enumerateFilesInDirectorySync = enumerateFilesInDirectorySync;
	exports.ensureString = ensureString;
	exports.ensureArray = ensureArray;
	exports.ensureCallback = ensureCallback;
	exports.zipFiles = zipFiles;
	exports.isRequestSuccessful = isRequestSuccessful;
	exports.createQrUrl = createQrUrl;
	exports.isAndroidPlatform = isAndroidPlatform;
	exports.isiOSPlatform = isiOSPlatform;
	exports.getRelativeToRootPath = getRelativeToRootPath;
	exports.isNumber = isNumber;

	exports.nop = function() {
		return 123;
	};

})();

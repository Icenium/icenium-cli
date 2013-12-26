///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import path = require("path");
import _ = require("underscore");
import util = require("util");
import querystring = require("querystring");
import log = require("./log");
import config = require("./config");
import Q = require("q");

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
export function enumerateFilesInDirectorySync(directoryPath, filterCallback?: (file: string, stat: fs.Stats) => boolean) {
	var result = [];
	enumerateFilesInDirectorySyncRecursive(result, directoryPath, filterCallback);
	return result;
}

export function ensureString(string, position) {
	if (typeof string !== "string") {
		throw new Error(util.format("Expected string as argument at position %d but got '%s'", position, util.inspect(string)));
	}
}

export function ensureArray(array, position) {
	if (Object.prototype.toString.call(array) !== "[object Array]") {
		throw new Error(util.format("Expected array as argument at position %d but got '%s'", position, util.inspect(array)));
	}
}

export function ensureCallback(callback, position) {
	if (typeof callback !== "function") {
		throw new Error(util.format("Expected callback as argument at position %d but got '%s'", position, util.inspect(callback)));
	}
}

export function createQrUrl(data) {
	return util.format("http://api.qrserver.com/v1/create-qr-code/?size=%dx%d&qzone=4&data=%s",
		config.QR_SIZE, config.QR_SIZE, querystring.escape(data));
}


//TODO: try 'archiver' module for zipping
export function zipFiles(zipFile, files, zipPathCallback, callback) {
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

export function isRequestSuccessful(request) {
	return request.statusCode >= 200 && request.statusCode < 300;
}

export function isAndroidPlatform(platform) {
	return platform.toLowerCase() === "android";
}

export function isiOSPlatform(platform) {
	return platform.toLowerCase() === "ios";
}

export function getRelativeToRootPath(rootPath, filePath) {
	var relativeToRootPath = filePath.substr(rootPath.length);
	return relativeToRootPath;
}

export function isNumber(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

export function abort(...args) {
	throw new Error(util.format.apply(null, arguments));
}

export function toHash(collection, keySelector, valueSelector) {
	var result = {};
	if (_.isArray(collection)) {
		for (var i = 0; i < collection.length; ++i) {
			result[keySelector(collection[i], i, collection)] =
				valueSelector(collection[i], i, collection);
		}
	} else {
		Object.keys(collection).forEach(function(key) {
			result[keySelector(collection[key], key, collection)] =
				valueSelector(collection[key], key, collection);
		});
	}
	return result;
}

var _projectFileSchema;
export function getProjectFileSchema(): any {
	if (!_projectFileSchema) {
		var propPath = path.join(__dirname, "../resources/project-properties.json");
		var contents = fs.readFileSync(propPath, { encoding: "utf8" });
		_projectFileSchema = JSON.parse(contents);
	}
	return _projectFileSchema;
}

export function saveFile(filePath, content) {
	return Q.ninvoke(fs, "writeFile", filePath, content);
}

export function deleteFile(filePath) {
	return Q.ninvoke(fs, "unlink", filePath)
		.catch(function() {});
}

//TODO: use module mkdirp
export function makeDirIfNotAvailable(filePath) {
	return Q.ninvoke(fs, "mkdir", filePath)
		.catch(function(error) {
			if (error.code !== "EEXIST") {
				throw error;
			}
		});
}

export function isEmptyDir(dir) {
	var defered = Q.defer();
	fs.readdir(dir, function(error, data) {
		if (error) {
			defered.reject(error);
		} else {
			defered.resolve(data.length === 0);
		}
	});
	return defered.promise;
}

export function nop() {
	return 123;
};

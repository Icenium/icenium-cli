///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import path = require("path");
import _ = require("underscore");
import util = require("util");
import querystring = require("querystring");
import log = require("./logger");
import Q = require("q");
import Future = require("fibers/future");

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

export function createQrUrl(data) {
	var $config = $injector.resolve("config");
	return util.format("http://api.qrserver.com/v1/create-qr-code/?size=%dx%d&qzone=4&data=%s",
		$config.QR_SIZE, $config.QR_SIZE, querystring.escape(data));
}

export function fromWindowsRelativePathToUnix(windowsRelativePath) {
	return windowsRelativePath.replace(/\\/g, "/");
}

export function isRequestSuccessful(request) {
	return request.statusCode >= 200 && request.statusCode < 300;
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

export function isStringOptionEmpty(optionValue) {
	return optionValue === undefined || optionValue === null || optionValue === "null" || optionValue === "false" || optionValue === "true";
}

export function registerCommand(module: string, commandName: string, executor: (module, args: string[]) => IFuture<void>) {
	var factory = function (): ICommand {
		return {
			execute: (args: string[]): void => {
				var mod = $injector.resolve(module);
				executor(mod, args).wait();
			}
		};
	};

	$injector.registerCommand(commandName, factory);
}

export function isOsX() {
	return process.platform.toUpperCase() === "DARWIN";
}

export function isWindows() {
	return /^win/.test(process.platform);
}

export function isWindows64() {
	return process.arch === "x64" && process.env.hasOwnProperty("PROCESSOR_ARCHITEW6432")
}
export function isWindows32() {
	return isWindows() && !isWindows64();
}

export function isDarwin() {
	return process.platform.toUpperCase() === "DARWIN";
}

export function stringReplaceAll(string: string, find: string, replace: string): string {
	return string.split(find).join(replace);
}

export function isNullOrWhitespace(input: string): boolean {
	if (!input) {
		return true;
	}

	return input.replace(/\s/gi, '').length < 1;
}

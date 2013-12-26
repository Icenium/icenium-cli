///<reference path=".d.ts"/>

"use strict";

import fs = require("fs");
import path = require("path");
import Q = require("q");
import options = require("./options");
import helpers = require("./helpers");

export function saveUserState(userState) {
	return deleteUserState()
		.then(function() {
			return helpers.saveFile(getUserStateFilePath(), JSON.stringify(userState));
		});
}

export function deleteUserState() {
	return helpers.deleteFile(getUserStateFilePath());
}

export function getUserState() {
	return readUserStateFile()
		.then(function(content) {
			return JSON.parse(content);
		});
}

function readUserStateFile():Q.Promise<string> {
	return Q.ninvoke<string>(fs, "readFile", getUserStateFilePath());
}

function getUserStateFilePath() {
	return path.join(options["profile-dir"], "user");
}

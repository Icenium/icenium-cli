///<reference path=".d.ts"/>

(function(){
	"use strict";
	var fs = require("fs"),
		path = require("path"),
		Q = require("q"),
		options = require("./options"),
		helpers = require("./helpers");

	function saveUserState(userState) {
		return deleteUserState()
			.then(function() {
				return helpers.saveFile(getUserStateFilePath(), JSON.stringify(userState));
			});
	}

	function deleteUserState() {
		return helpers.deleteFile(getUserStateFilePath());
	}

	function getUserState() {
		return readUserStateFile()
			.then(function(content) {
				return JSON.parse(content);
			});
	}

	function readUserStateFile() {
		return Q.ninvoke(fs, "readFile", getUserStateFilePath());
	}

	function getUserStateFilePath() {
		return path.join(options["profile-dir"], "user");
	}

	exports.getUserState = getUserState;
	exports.saveUserState = saveUserState;
	exports.deleteUserState = deleteUserState;
})();

///<reference path=".d.ts"/>

(function() {
	"use strict";
	var _ = require("underscore");

	var platforms = {};

	try {
		platforms.android = require("./platforms/android");
	} catch (ex) {}

	try {
		platforms.ios = require("./platforms/ios");
	} catch (ex) {}

	function get(platform) {
		if (!platform) {
			return platforms;
		}
		else if (isSupported(platform)) {
			return platforms[platform.toLowerCase()];
		}
		return null;
	}

	function getPlatformsNames() {
		var names = [];
		_.forEach(platforms, function(platform){
			names.push(platform.getPlatformName());
		});
		return names;
	}

	function isSupported(platform) {
		return !platform ||
			(platform && platforms[platform.toLowerCase()]);
	}

	exports.isSupported = isSupported;
	exports.get = get;
	exports.getPlatformsNames = getPlatformsNames;
}());
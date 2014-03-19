///<reference path=".d.ts"/>
"use strict";

var platforms: {
	[index: string]: any;
	android?: any;
	ios?: any;
} = {};

try {
	platforms.android = require("./platforms/android");
} catch (ex) {}

try {
	platforms.ios = require("./platforms/ios");
} catch (ex) {}

export function get(platform?: string) {
	if (!platform) {
		return platforms;
	}
	else if (isSupported(platform)) {
		return platforms[platform.toLowerCase()];
	}
	return null;
}

export function getPlatformsNames() {
	var names = [];
	_.forEach(platforms, function(platform:any){
		names.push(platform.getPlatformName());
	});
	return names;
}

export function isSupported(platform) {
	return !platform ||
		(platform && platforms[platform.toLowerCase()]);
}

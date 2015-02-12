///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import osenv = require("osenv");
import commonOptions = require("./common/options");
import hostInfo = require("./common/host-info");

declare var exports: any;

var knownOpts: any = {
		"companion": Boolean,
		"download": Boolean,
		"certificate": String,
		"provision": String,
		"template": String,
		"deploy": String,
		"device": String,
		"file": String,
		"save-to": String,
		"saveTo": String,
		"client": String,
		"available": Boolean,
		"release": Boolean,
		"debug": Boolean,
		"valid-value": Boolean,
		"validValue": Boolean
	},
	shorthands: IStringDictionary = {
		"t": "template",
		"r": "release",
		"d": "debug"
	};

_.extend(commonOptions.knownOpts, knownOpts);
_.extend(commonOptions.shorthands, shorthands);

var defaultProfileDir = "";
var blackDragonCacheFolder = "Telerik/BlackDragon";
var appBuilderCacheFolder = ".appbuilder-cli";
if(hostInfo.isWindows()) {
	defaultProfileDir = path.join(process.env.LocalAppData, blackDragonCacheFolder, appBuilderCacheFolder);
} else {
	defaultProfileDir = path.join(osenv.home(), ".local/share", blackDragonCacheFolder, appBuilderCacheFolder);
}

commonOptions.setProfileDir(defaultProfileDir);
_(commonOptions.validateArgs("appbuilder")).each((val,key) => {
	key = shorthands[key] || key;
	commonOptions[key] = val;
});
exports.knownOpts = knownOpts;
exports.shorthands = shorthands;
export = exports;

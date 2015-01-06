///<reference path=".d.ts"/>
"use strict";

import helpers = require("./common/helpers");
import _ = require("lodash");
import path = require("path");
import osenv = require("osenv");
import commonOptions = require("./common/options");
import hostInfo = require("./host-info");

var knownOpts: any = {
		"companion": Boolean,
		"download": Boolean,
		"certificate": String,
		"provision": String,
		"template": String,
		"appid": String,
		"deploy": String,
		"device": String,
		"file": String,
		"save-to": String,
		"saveTo": String,
		"client": String,
		"available": Boolean,
		"release": Boolean,
		"debug": Boolean
	},
	shorthands: IStringDictionary = {
		"t": "template",
		"r": "release",
		"d": "debug"
	};

_.extend(knownOpts, commonOptions.knownOpts);
_.extend(shorthands, commonOptions.shorthands);

var defaultProfileDir = "";
var blackDragonCacheFolder = "Telerik/BlackDragon";
var appBuilderCacheFolder = ".appbuilder-cli";
if(hostInfo.isWindows()) {
	defaultProfileDir = path.join(process.env.LocalAppData, blackDragonCacheFolder, appBuilderCacheFolder);
} else {
	defaultProfileDir = path.join(osenv.home(), ".local/share", blackDragonCacheFolder, appBuilderCacheFolder);
}

commonOptions.setProfileDir(defaultProfileDir);
var parsed = helpers.getParsedOptions(knownOpts, shorthands, "appbuilder");

Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);
exports.knownOpts = knownOpts;

declare var exports: any;
export = exports;

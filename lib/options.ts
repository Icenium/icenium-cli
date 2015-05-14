///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import osenv = require("osenv");
import commonOptions = require("./common/options");
import helpers = require("./helpers");
import hostInfo = require("./common/host-info");

declare let exports: any;

let knownOpts: any = {
		"companion": Boolean,
		"download": Boolean,
		"certificate": String,
		"provision": String,
		"template": String,
		"deploy": String,
		"device": String,
		"file": String,
		"save-to": String,
		"client": String,
		"available": Boolean,
		"release": Boolean,
		"debug": Boolean,
		"valid-value": Boolean,
		"screenBuilderCacheDir": String,
		"force": Boolean,
		"verified": Boolean,
		"core": Boolean,
		"professional": Boolean,
		"latest": Boolean,
		"publish": Boolean,
		"send-push": Boolean,
		"send-email": Boolean,
		"group": Array
	},
	shorthands: IStringDictionary = {
		"t": "template",
		"r": "release",
		"d": "debug",
		"f": "force"
	};

_.extend(commonOptions.knownOpts, knownOpts);
_.extend(commonOptions.shorthands, shorthands);

let defaultProfileDir = helpers.defaultProfileDir();
commonOptions.setProfileDir(defaultProfileDir);

let errors: IErrors = $injector.resolve("errors");
_(errors.validateArgs("appbuilder", commonOptions.knownOpts, commonOptions.shorthands)).each((val,key) => {
	key = shorthands[key] || key;
	commonOptions[key] = val;
}).value();

commonOptions["screenBuilderCacheDir"] = (hostInfo.isWindows() && commonOptions.defaultProfileDir === commonOptions.profileDir) ? path.join(process.env.LocalAppData, "Telerik", "sb"): commonOptions.profileDir;

exports.knownOpts = knownOpts;
exports.shorthands = shorthands;
export = exports;

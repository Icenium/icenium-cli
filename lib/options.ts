///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import osenv = require("osenv");
import commonOptions = require("./common/options");
import helpers = require("./helpers");

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
		"client": String,
		"available": Boolean,
		"release": Boolean,
		"debug": Boolean,
		"valid-value": Boolean
	},
	shorthands: IStringDictionary = {
		"t": "template",
		"r": "release",
		"d": "debug"
	};

_.extend(commonOptions.knownOpts, knownOpts);
_.extend(commonOptions.shorthands, shorthands);

var defaultProfileDir = helpers.defaultProfileDir();
commonOptions.setProfileDir(defaultProfileDir);

var errors: IErrors = $injector.resolve("errors");
_(errors.validateArgs("appbuilder", commonOptions.knownOpts, commonOptions.shorthands)).each((val,key) => {
	key = shorthands[key] || key;
	commonOptions[key] = val;
}).value();

exports.knownOpts = knownOpts;
exports.shorthands = shorthands;
export = exports;

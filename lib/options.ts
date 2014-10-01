///<reference path=".d.ts"/>
"use strict";

import helpers = require("./common/helpers");

import _ = require("underscore"); 
import path = require("path");
import osenv = require("osenv");
import commonOptions = require("./common/options");

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
		"livesync": Boolean,
		"timeout": String,
		"save-to": String,
		"client": String,
		"available": Boolean
	},
	shorthands: IStringDictionary = {
		"t": "template"
	};

_.extend(knownOpts, commonOptions.knownOpts);
_.extend(shorthands, commonOptions.shorthands);

commonOptions.setProfileDir(".appbuilder-cli");
var parsed = helpers.getParsedOptions(knownOpts, shorthands);

Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);
exports.knownOpts = knownOpts;

declare var exports: any;
export = exports;

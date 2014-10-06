///<reference path=".d.ts"/>
"use strict";

import helpers = require("./common/helpers");
import commonOptions = require("./common/options");
import _ = require("underscore"); 
var yargs: any = require("yargs");

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
		"client": String
	},
	shorthands: IStringDictionary = {
		"t": "template"
	};


var parsed = yargs.argv;
_.extend(knownOpts, commonOptions.knownOpts);
_.extend(shorthands, commonOptions.shorthands);

parsed = helpers.getParsedOptions(knownOpts, shorthands);
parsed["profile-dir"] = commonOptions["profile-dir"];
Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);

exports.knownOpts = knownOpts;

declare var exports: any;
export = exports;

///<reference path=".d.ts"/>

"use strict";

import path = require("path");

var nopt = <Function> require("nopt");

var knownOpts:any = {
		"log" : String,
		"verbose" : Boolean,
		"download" : Boolean,
		"certificate" : String,
		"provision" : String,
		"path" : String,
		"template": String,
		"appid" : String,
		"deploy": String,
		"watch": Boolean,
		"device": String,
		"file": String,
		"livesync": Boolean,
		"version": Boolean,
		"help": Boolean,
		"timeout": String,
		"save-to": String,
		"json": Boolean,
		"client": String
	},
	shorthands = {
		"v" : ["--verbose"],
		"p" : ["--path"],
		"t" : ["--template"]
	},
	parsed = nopt(knownOpts, shorthands, process.argv, 2),
	defaultProfileDir = path.join(process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH, ".appbuilder-cli");

parsed["profile-dir"] = parsed["profile-dir"] || defaultProfileDir;

Object.keys(parsed).forEach(function(opt) {
	exports[opt] = parsed[opt];
});

exports.knownOpts = knownOpts;

declare var exports:any;
export = exports;
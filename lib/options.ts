///<reference path=".d.ts"/>

"use strict";

import path = require("path");

var yargs: any = require("yargs");

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
		"v" : "verbose",
		"p" : "path",
		"t" : "template"
	};

Object.keys(knownOpts).forEach((opt) => {
	var type = knownOpts[opt];
	if (type === String) {
		yargs.string(opt);
	} else if (type === Boolean) {
		yargs.boolean(opt);
	}
});

Object.keys(shorthands).forEach((key) => {
	yargs.alias(key, shorthands[key]);
});

var parsed = yargs.argv,
	defaultProfileDir = path.join(process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH, ".appbuilder-cli");

Object.keys(parsed).forEach((opt) => {
	if (knownOpts[opt] !== Boolean && typeof(parsed[opt]) === 'boolean') {
		delete parsed[opt];
	}
});

parsed["profile-dir"] = parsed["profile-dir"] || defaultProfileDir;

Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);

exports.knownOpts = knownOpts;

declare var exports:any;
export = exports;
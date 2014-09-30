///<reference path=".d.ts"/>
import path = require("path");
import util = require("util");
import helpers = require("./common/helpers");
var yargs: any = require("yargs");

var knownOpts: any = {
		"log": String,
		"verbose": Boolean,
		"companion": Boolean,
		"download": Boolean,
		"certificate": String,
		"provision": String,
		"path": String,
		"template": String,
		"appid": String,
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
	shorthands: IStringDictionary = {
		"v": "verbose",
		"p": "path",
		"t": "template"
	};

var defaultProfileDir = path.join(process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH, ".appbuilder-cli");
var parsed = helpers.getParsedOptions(knownOpts, shorthands, defaultProfileDir);

Object.keys(parsed).forEach((opt) => exports[opt] = parsed[opt]);

exports.knownOpts = knownOpts;

declare var exports: any;
export = exports;
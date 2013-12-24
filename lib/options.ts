///<reference path=".d.ts"/>

(function() {
	"use strict";
	var nopt = require("nopt"),
		path = require("path"),
		knownOpts = {
			"log" : String,
			"verbose" : Boolean,
			"download" : Boolean,
			"certificate" : String,
			"provision" : String,
			"path" : String,
			"template": String,
			"appid" : String,
			"deploy": String,
			"live": Boolean,
			"device": String,
			"file": String
		},
		shorthands = {
			"v" : ["--verbose"],
			"p" : ["--path"],
			"t" : ["--template"],
		},
		parsed = nopt(knownOpts, shorthands, process.argv, 2),
		defaultProfileDir = path.join(process.env.USERPROFILE || process.env.HOME || process.env.HOMEPATH, ".icenium-cli");

	parsed["profile-dir"] = parsed["profile-dir"] || defaultProfileDir;

	Object.keys(parsed).forEach(function(opt) {
		exports[opt] = parsed[opt];
	});

	exports.knownOpts = knownOpts;
})();

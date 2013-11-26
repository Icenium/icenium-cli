"use strict";

(function() {
	var nopt = require("nopt"),
		path = require("path"),
		knownOpts = {
			"user-name" : String,
			"password" : String,
			"log" : String,
			"verbose" : Boolean,
			"download" : Boolean,
			"certificate" : String,
			"provision" : String
		},
		shorthands = {
			"v" : ["--verbose"]
		},
		parsed = nopt(knownOpts, shorthands, process.argv, 2),
		defaultProfileDir = path.join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, ".icenium-cli");

	parsed["profile-dir"] = parsed["profile-dir"] || defaultProfileDir;

	Object.keys(parsed).forEach(function(opt) {
		exports[opt] = parsed[opt];
	})
})();

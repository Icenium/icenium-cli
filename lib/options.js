"use strict";

(function() {
	var nopt = require("nopt")
		, knownOpts = {
			"user-name" : [String],
			"password" : [String],
		}
		, shorthands = {

		}
		,parsed = nopt(knownOpts, shorthands, process.argv, 2);

	Object.keys(parsed).forEach(function(opt) {
		exports[opt] = parsed[opt];
	})
})();

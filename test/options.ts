///<reference path=".d.ts"/>
"use strict";

import options = require("../lib/options");
var assert = require("chai").assert;
var yargs: any = require("yargs");

describe("options", () => {
	describe("dashed known options", () => {
		it("are added correctly", () => {
			// yargs adds dashed values to yargs.argv in two ways:
			// with dash and without dash, replacing first symbol after it with its toUpper equivalent
			// for example --save-to is added to yargs.argv as "save-to" and "saveTo"
			// this test assures all options with dash are added to knownOpts in both ways
			var knowOptionsKeys = _.keys(options.knownOpts);
			var dashedOptions = _.filter(knowOptionsKeys, (opt: string) => _.contains(opt, "-"));
			_.forEach(dashedOptions, (opt: string) => {
				var dashIndex = opt.indexOf("-");
				var secondaryPresentation = opt.slice(0, dashIndex) + opt[dashIndex + 1].toUpperCase() + opt.slice(dashIndex + 2);
				assert.include(knowOptionsKeys, secondaryPresentation, "option " + opt + " is not added to knownOpts correctly. It should be added as " + opt + " and " + secondaryPresentation);
			});
		});
	});
});

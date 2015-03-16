///<reference path=".d.ts"/>
"use strict";

import helpers = require("../lib/common/helpers");
import errorsLib = require("../lib/common/errors");
var assert = require("chai").assert;

var isExecutionStopped = false;

var knownOpts = {
	"path": String,
	"help": Boolean,
	"verbose": Boolean,
	"profile-dir": String,
	"some-dashed-value": String,
	"a-b-c-d-e-f-g": String
};

var shorthands = {
	"v": "verbose"
};

describe("common helpers", () => {
	var errors: IErrors;
	before(() => {
		errors = new errorsLib.Errors();
		errors.failWithoutHelp = (message: string, ...args: any[]): void => {
			isExecutionStopped = true;
		}
	});

	describe("validateYargsArguments", () => {
		it("breaks execution when option is not valid", () => {
			isExecutionStopped = false;
			var parsed = {
				"pathr": "incorrect argument"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option does not have value", () => {
			isExecutionStopped = false;
			var parsed = {
				// If you do not pass value to an option, it's automatically set as true.
				"path": true
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid option has correct value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "SomeDir"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has incorrect value", () => {
			isExecutionStopped = false;
			var parsed = {
				"help": "Invalid string value" // help requires boolean value.
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has empty string value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has value with spaces only", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "  "
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when shorthand option is not valid", () => {
			isExecutionStopped = false;
			var parsed = {
				"r": "incorrect shorthand"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid shorthand option has correct value", () => {
			isExecutionStopped = false;
			var parsed = {
				"v": true
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid shorthand option has incorrect value", () => {
			isExecutionStopped = false;
			var parsed = {
				"v": "invalid string value" // v requires boolean value
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		// all numbers are changed to strings before calling validateYargsArguments
		it("does not break execution when valid option has number value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "1"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has null value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			parsed.path = null;
			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has undefined value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			parsed.path = undefined;
			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		// when you pass --option with dash, yargs adds it to yargs.argv in two ways:
		// for ex. '$ appbuilder login --profile-dir "some dir"' will add profile dir to yargs.argv as: profileDir and profile-dir
		describe("validates dashed options correctly",() => {
			it("does not break execution when dashed option with single dash is passed",() => {
				isExecutionStopped = false;
				var parsed = {
					"profile-dir": "some dir",
					"profileDir": "some dir"
				};

				errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (profile-dir) are added to yargs.argv in two ways: profile-dir and profileDir");
			});

			it("does not break execution when dashed option with two dashes is passed",() => {
				isExecutionStopped = false;
				var parsed = {
					"some-dashed-value": "some dir",
					"someDashedValue": "some dir"
				};

				errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (some-dashed-value) are added to yargs.argv in two ways: some-dashed-value and someDashedValue");
			});

			it("does not break execution when dashed option with a lot of dashes is passed",() => {
				isExecutionStopped = false;
				var parsed = {
					"a-b-c-d-e-f-g": "some dir",
					"aBCDEFG": "some dir"
				};

				errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (a-b-c-d-e-f-g) are added to yargs.argv in two ways: a-b-c-d-e-f-g and aBCDEFG.");
			});
		});
	});
});

///<reference path=".d.ts"/>
"use strict";

import helpers = require("../lib/common/helpers");
import errorsLib = require("../lib/common/errors");
var assert = require("chai").assert;

var isExecutionStopped = false;

var knownOpts = {
	"path": String,
	"help": Boolean,
	"verbose": Boolean
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
	});
});

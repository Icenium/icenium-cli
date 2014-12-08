///<reference path=".d.ts"/>
"use strict";

import helpers = require("../lib/common/helpers");
var assert = require("chai").assert;

var isExecutionStopped = false;
var mockBreakExecution = (message: string): void => {
	isExecutionStopped = true;
};

var knownOpts = {
	"path": String,
	"help": Boolean,
	"verbose": Boolean
};

var shorthands = {
	"v": "verbose"
};

describe("common helpers", () => {
	describe("validateYargsArguments", () => {
		it("breaks execution when option is not valid", () => {
			isExecutionStopped = false;
			var parsed = {
				"pathr": "incorrect argument"
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option does not have value", () => {
			isExecutionStopped = false;
			var parsed = {
				// If you do not pass value to an option, it's automatically set as true.
				"path": true
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid option has correct value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "SomeDir"
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has incorrect value", () => {
			isExecutionStopped = false;
			var parsed = {
				"help": "Invalid string value" // help requires boolean value.
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has empty string value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has value with spaces only", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "  "
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when shorthand option is not valid", () => {
			isExecutionStopped = false;
			var parsed = {
				"r": "incorrect shorthand"
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid shorthand option has correct value", () => {
			isExecutionStopped = false;
			var parsed = {
				"v": true
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid shorthand option has incorrect value", () => {
			isExecutionStopped = false;
			var parsed = {
				"v": "invalid string value" // v requires boolean value
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		// all numbers are changed to strings before calling validateYargsArguments
		it("does not break execution when valid option has number value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "1"
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has null value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			parsed.path = null;
			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has undefined value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			parsed.path = undefined;
			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});
	});
});

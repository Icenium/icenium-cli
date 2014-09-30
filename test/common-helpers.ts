///<reference path=".d.ts"/>
"use strict";

import helpers = require("../lib/common/helpers");
import options = require("../lib/options");
var assert = require("chai").assert;

var isExecutionStopped = false;
var mockBreakExecution = (message: string): void => {
	isExecutionStopped = true;
};

describe("common helpers", () => {
	describe("validateYargsArguments", () => {
		it("breaks execution when option is not valid", () => {
			isExecutionStopped = false;
			var parsed = {
				"pathr": "incorrect argument"
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, options.knownOpts, true);

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option does not have value", () => {
			isExecutionStopped = false;
			var parsed = {
				// If you do not pass value to an option, it's automatically set as true.
				"path": true
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, options.knownOpts, true);

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid option has value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "SomeDir"
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, options.knownOpts, true);

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has empty string value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, options.knownOpts, true);

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has value with spaces only", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "  "
			};

			helpers.breakExecution = mockBreakExecution;
			helpers.validateYargsArguments(parsed, options.knownOpts, true);

			assert.isTrue(isExecutionStopped);
		});
	});
});
///<reference path=".d.ts"/>
"use strict";

import errorsLib = require("../lib/common/errors");
let assert = require("chai").assert;

let isExecutionStopped = false;

let knownOpts = {
	"path": String,
	"help": Boolean,
	"verbose": Boolean,
	"profile-dir": String,
	"some-dashed-value": String,
	"a-b-c-d-e-f-g": String
};

let shorthands = {
	"v": "verbose"
};

describe("common errors", () => {
	let errors: IErrors;
	before(() => {
		errors = new errorsLib.Errors();
		errors.failWithoutHelp = (message: string, ...args: any[]): void => {
			isExecutionStopped = true;
		}
	});

	describe("validateYargsArguments", () => {
		it("breaks execution when option is not valid", () => {
			isExecutionStopped = false;
			let parsed = {
				"pathr": "incorrect argument"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option does not have value", () => {
			isExecutionStopped = false;
			let parsed = {
				// If you do not pass value to an option, it's automatically set as true.
				"path": true
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid option has correct value", () => {
			isExecutionStopped = false;
			let parsed = {
				"path": "SomeDir"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has incorrect value", () => {
			isExecutionStopped = false;
			let parsed = {
				"help": "Invalid string value" // help requires boolean value.
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has empty string value", () => {
			isExecutionStopped = false;
			let parsed = {
				"path": ""
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has value with spaces only", () => {
			isExecutionStopped = false;
			let parsed = {
				"path": "  "
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when shorthand option is not valid", () => {
			isExecutionStopped = false;
			let parsed = {
				"r": "incorrect shorthand"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid shorthand option has correct value", () => {
			isExecutionStopped = false;
			let parsed = {
				"v": true
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid shorthand option has incorrect value", () => {
			isExecutionStopped = false;
			let parsed = {
				"v": "invalid string value" // v requires boolean value
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		// all numbers are changed to strings before calling validateYargsArguments
		it("does not break execution when valid option has number value", () => {
			isExecutionStopped = false;
			let parsed = {
				"path": "1"
			};

			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has null value", () => {
			isExecutionStopped = false;
			let parsed = {
				"path": ""
			};

			parsed.path = null;
			errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has undefined value", () => {
			isExecutionStopped = false;
			let parsed = {
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
				let parsed = {
					"profile-dir": "some dir",
					"profileDir": "some dir"
				};

				errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (profile-dir) are added to yargs.argv in two ways: profile-dir and profileDir");
			});

			it("does not break execution when dashed option with two dashes is passed",() => {
				isExecutionStopped = false;
				let parsed = {
					"some-dashed-value": "some dir",
					"someDashedValue": "some dir"
				};

				errors.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (some-dashed-value) are added to yargs.argv in two ways: some-dashed-value and someDashedValue");
			});

			it("does not break execution when dashed option with a lot of dashes is passed",() => {
				isExecutionStopped = false;
				let parsed = {
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

///<reference path=".d.ts"/>
"use strict";

import helpers = require("../lib/common/helpers");
var assert = require("chai").assert;

var isExecutionStopped = false;

class ErrorsNoFailStub implements IErrors {
	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) { throw new Error(); }

	failWithoutHelp(message: string, ...args: any[]): void {
		isExecutionStopped = true;
	}

	beginCommand(action: () => IFuture<boolean>, printHelpCommand: () => IFuture<boolean>): IFuture<boolean> {
		return (() => {
			try {
				return action().wait();
			} catch(ex) {
				return false;
			}
		}).future<boolean>()();
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }
}

var knownOpts = {
	"path": String,
	"help": Boolean,
	"verbose": Boolean
};

var shorthands = {
	"v": "verbose"
};

describe("common helpers", () => {
	var oldInjector: IInjector;
	before(() => {
		oldInjector = $injector;
		$injector.register("errors", ErrorsNoFailStub);
	});

	after(() => {
		$injector = oldInjector;
	});

	describe("validateYargsArguments", () => {
		it("breaks execution when option is not valid", () => {
			isExecutionStopped = false;
			var parsed = {
				"pathr": "incorrect argument"
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option does not have value", () => {
			isExecutionStopped = false;
			var parsed = {
				// If you do not pass value to an option, it's automatically set as true.
				"path": true
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid option has correct value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "SomeDir"
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has incorrect value", () => {
			isExecutionStopped = false;
			var parsed = {
				"help": "Invalid string value" // help requires boolean value.
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has empty string value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has value with spaces only", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "  "
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when shorthand option is not valid", () => {
			isExecutionStopped = false;
			var parsed = {
				"r": "incorrect shorthand"
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid shorthand option has correct value", () => {
			isExecutionStopped = false;
			var parsed = {
				"v": true
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid shorthand option has incorrect value", () => {
			isExecutionStopped = false;
			var parsed = {
				"v": "invalid string value" // v requires boolean value
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		// all numbers are changed to strings before calling validateYargsArguments
		it("does not break execution when valid option has number value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": "1"
			};

			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has null value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			parsed.path = null;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has undefined value", () => {
			isExecutionStopped = false;
			var parsed = {
				"path": ""
			};

			parsed.path = undefined;
			helpers.validateYargsArguments(parsed, knownOpts, shorthands, "mocha");

			assert.isTrue(isExecutionStopped);
		});
	});
});

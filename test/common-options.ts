///<reference path=".d.ts"/>
"use strict";

import optionsPath = require("../lib/common/options");
import errorsLib = require("../lib/common/errors");
import yok = require("./../lib/common/yok");
import yargs = require("yargs");
let assert = require("chai").assert;
let optionType = optionsPath.OptionType;

let isExecutionStopped = false;

let knownOpts = {
	"path": { type: optionType.String },
	"help": { type: optionType.Boolean } ,
	"verbose": { type: optionType.Boolean, alias: "v" },
	"profileDir": { type: optionType.String },
	"someDashedValue": { type: optionType.String },
	"aBCDEFG": { type: optionType.String }
};

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();
	testInjector.register("options", {});
	testInjector.register("staticConfig", {
		CLIENT_NAME: ""
	});
	testInjector.register("hostInfo", {});
	
	return testInjector;
}

function createOptions(testInjector: IInjector): IOptions {
	let options = testInjector.resolve(optionsPath.OptionsBase, { options: knownOpts, defaultProfileDir: "1" }); // Validation is triggered in options's constructor
	return options;
}

describe("common options", () => {
	let testInjector: IInjector;
	before(() => {
		testInjector = createTestInjector();
		
		let errors = new errorsLib.Errors();
        errors.failWithoutHelp = (message: string, ...args: any[]): void => {
            isExecutionStopped = true;
        }
		
		testInjector.register("errors", errors);
		
		yargs.argv = {}; // We need to ensure that the options from previous test are not passed to the next one
	});

	describe("validateOptions", () => {
		it("breaks execution when option is not valid", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"pathr": "incorrect argument"
			};
			
			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option does not have value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				// If you do not pass value to an option, it's automatically set as true.
				"path": true
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		});

		it("does not break execution when valid option has correct value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"path": "SomeDir"
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has incorrect value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"help": "Invalid string value" // help requires boolean value.
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has empty string value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"path": ""
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has value with spaces only", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"path": "  "
			};

			let options = createOptions(testInjector);
			options.validateOptions();
			
			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when shorthand option is not valid", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"r": "incorrect shorthand"
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		}); 

		it("does not break execution when valid shorthand option has correct value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"v": true
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isFalse(isExecutionStopped);
			assert.isTrue(options.verbose);
		});

		it("breaks execution when valid shorthand option has incorrect value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"v": "invalid string value" // v requires boolean value
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		});

		// all numbers are changed to strings before calling validateOptions
		it("does not break execution when valid option has number value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"path": "1"
			};

			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isFalse(isExecutionStopped);
		});

		it("breaks execution when valid option has null value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"path": ""
			};

			yargs.argv.path = null;
			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		});

		it("breaks execution when valid option has undefined value", () => {
			isExecutionStopped = false;
			yargs.argv = {
				"path": ""
			};

			yargs.argv.path = undefined;
			let options = createOptions(testInjector);
			options.validateOptions();

			assert.isTrue(isExecutionStopped);
		});

		// when you pass --option with dash, yargs adds it to yargs.argv in two ways:
		// for ex. '$ appbuilder login --profile-dir "some dir"' will add profile dir to yargs.argv as: profileDir and profile-dir
		describe("validates dashed options correctly",() => {
			it("does not break execution when dashed option with single dash is passed",() => {
				isExecutionStopped = false;
				yargs.argv = {
					"profile-dir": "some dir",
					"profileDir": "some dir"
				};

				let options = createOptions(testInjector);
				options.validateOptions();
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (profile-dir) are added to yargs.argv in two ways: profile-dir and profileDir");
			});

			it("does not break execution when dashed option with two dashes is passed",() => {
				isExecutionStopped = false;
				yargs.argv = {
					"some-dashed-value": "some dir",
					"someDashedValue": "some dir"
				};

				let options = createOptions(testInjector);
				options.validateOptions();
				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (some-dashed-value) are added to yargs.argv in two ways: some-dashed-value and someDashedValue");
			});

			it("does not break execution when dashed option with a lot of dashes is passed",() => {
				isExecutionStopped = false;
				yargs.argv = {
					"a-b-c-d-e-f-g": "some dir",
					"aBCDEFG": "some dir"
				};

				let options = createOptions(testInjector);
				options.validateOptions();

				assert.isFalse(isExecutionStopped, "Dashed options should be validated in specific way. Make sure validation allows yargs specific behavior:" +
					"Dashed options (a-b-c-d-e-f-g) are added to yargs.argv in two ways: a-b-c-d-e-f-g and aBCDEFG.");
			});
		});
	});
});


function createOptionsWithProfileDir(profileDir: string): IOptions {
	let knownOptions = {
		"profile-dir": { type: optionType.String }
	}

	let testInjector = new yok.Yok();
	testInjector.register("errors", {});
	testInjector.register("staticConfig", {});
	let options = testInjector.resolve(optionsPath.OptionsBase, { options: knownOptions, defaultProfileDir: profileDir });
	return options;
}

describe("common options profile-dir tests", () => {
	describe("setProfileDir", () => {
		it("uses profile-dir from yargs when it exists", () => {

			let expectedProfileDir = "TestDir";
			
			yargs.argv = {};
			yargs.argv["profile-dir"] = expectedProfileDir;
			yargs.argv["profileDir"] = expectedProfileDir;
			
			let options = createOptionsWithProfileDir("");
			options.validateOptions();			
			
			assert.equal(options.profileDir, expectedProfileDir);
		});

		it("sets default profile-dir when it is not passed on command line", () => {
			let profileDir = "TestDir";
			let options = createOptionsWithProfileDir("TestDir");
			options.validateOptions();
			assert.equal(options.profileDir, profileDir);
		});

		it("uses profileDir from yargs when it exists", () => {
			let expectedProfileDir = "TestDir";
			
			yargs.argv.profileDir = expectedProfileDir;			
			let options = createOptionsWithProfileDir("");
			options.validateOptions();
			
			assert.equal(options.profileDir, expectedProfileDir);
		});
	}); 
});

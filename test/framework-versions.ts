///<reference path=".d.ts"/>
"use strict";

import yok = require("../lib/common/yok");

import Future = require("fibers/future");
import stubs = require("./stubs");
import util = require("util");
var assert = require("chai").assert;

var fileSystemFile = require("../lib/common/file-system");
var hashServiceFile = require("../lib/services/hash-service");
var printVersionsFile = require("../lib/commands/framework-versions/print-versions");
var setVersionFile = require("../lib/commands/framework-versions/set-version");

function createTestInjector(): IInjector {
	var testInjector = new yok.Yok();

	testInjector.register("fs", fileSystemFile.FileSystem);
	testInjector.register("errors", {
		fail: (...args: any[]) => { throw new Error(args[0]); }
	});

	testInjector.register("project", {
		ensureProject: () => { },
		ensureCordovaProject: () => { },
		projectData: { "FrameworkVersion": "" },
		saveProject: (): IFuture<void> => { return (() => { }).future<void>()() },
		onFrameworkVersionChanging: (): IFuture<void> => { return (() => { }).future<void>()() },
		projectType: 1 //Cordova
	});

	testInjector.register("cordovaMigrationService", {
		getSupportedVersions: (): IFuture<string[]> => { 
			return (() => {
				return ["1.0.0", "1.0.1", "1.0.2"];
			}).future<string[]>()()
		},

		getSupportedFrameworks: (): IFuture<Server.FrameworkVersion[]> => {
			return (() => {
				return [{ DisplayName: "version_1_0_0", Version: "1.0.0" }, { DisplayName: "version_1_0_1", Version: "1.0.1" }]
			}).future<Server.FrameworkVersion[]>()();
		},

		getDisplayNameForVersion: (version: string): IFuture<string> => {
			return ((): string => {
				return "version_1_0_0";
			}).future<string>()();
		}
	});

	testInjector.register("mobileframework|*print", printVersionsFile.PrintFrameworkVersionsCommand);
	testInjector.register("mobileframework|set", setVersionFile.SetFrameworkVersionCommand);

	return testInjector;
}

describe("mobileframework", () => {
	describe("MobileFrameworkCommandParameter", () => {
		it("fails when version is not in correct format", () => {
			var testInjector = createTestInjector();
			var message: string;
			var mobileFwCP: ICommandParameter = new setVersionFile.MobileFrameworkCommandParameter(testInjector.resolve("cordovaMigrationService"),
				testInjector.resolve("project"), testInjector.resolve("errors"));
			try {
				mobileFwCP.validate("1").wait();
			} catch(e) {
				message = e.message;
			}

			assert.isTrue(message.indexOf("not in correct format") > -1);
		});

		it("fails when version is not supported", () => {
			var testInjector = createTestInjector();
			var message: string;
			var mobileFwCP: ICommandParameter = new setVersionFile.MobileFrameworkCommandParameter(testInjector.resolve("cordovaMigrationService"),
				testInjector.resolve("project"), testInjector.resolve("errors"));
			try {
				mobileFwCP.validate("1.0.5").wait();
			} catch(e) {
				message = e.message;
			}

			assert.isTrue(message.indexOf("not a supported version") > -1);
		});

		it("returns true when version is correct", () => {
			var testInjector = createTestInjector();
			var mobileFwCP: ICommandParameter = new setVersionFile.MobileFrameworkCommandParameter(testInjector.resolve("cordovaMigrationService"),
				testInjector.resolve("project"), testInjector.resolve("errors"));

			assert.isTrue(mobileFwCP.validate("1.0.0").wait());
		});
	});

	describe("print", () => {
		it("prints display names of supported versions", () => {
			var expectedOutput = ["version_1_0_0", "version_1_0_1"];
			var testInjector = createTestInjector();
			var message: string;
			testInjector.register("logger", {
				info: (formatStr: string, ...args: string[]) => {
					message += formatStr;
				}
			});
			var mbFrm: ICommand = testInjector.resolve("mobileframework|*print");
			mbFrm.execute([]).wait();
			_.each(expectedOutput, version => {
				assert.isTrue(message.indexOf(version) > -1);
			});
		});
	});
});
///<reference path=".d.ts"/>
"use strict";

import options = require("../lib/common/options");
import osenv = require("osenv");
import path = require("path");
var assert = require("chai").assert;
var yargs: any = require("yargs");
var hostInfo = require("../lib/common/host-info");

describe("common options", () => {
	describe("setProfileDir", () => {
		it("uses profile-dir from yargs when it exists", () => {
			yargs.argv["profile-dir"] = undefined;
			yargs.argv["profileDir"] = undefined;
			var expectedProfileDir = "TestDir";
			yargs.argv["profile-dir"] = expectedProfileDir;
			options.setProfileDir("");
			assert.equal(options["profile-dir"], expectedProfileDir);
			assert.equal(options["profileDir"], expectedProfileDir);
		});

		it("sets default profile-dir when it is not passed on command line", () => {
			yargs.argv["profile-dir"] = undefined;
			yargs.argv["profileDir"] = undefined;
			var profileDir = "TestDir";
			options.setProfileDir("TestDir");
			assert.equal(options["profile-dir"], profileDir);
			assert.equal(options["profileDir"], profileDir);
		});

		it("uses profileDir from yargs when it exists", () => {
			yargs.argv["profile-dir"] = undefined;
			yargs.argv["profileDir"] = undefined;
			var expectedProfileDir = "TestDir";
			yargs.argv["profileDir"] = expectedProfileDir;
			options.setProfileDir("");
			assert.equal(options["profileDir"], expectedProfileDir);
			assert.equal(options["profile-dir"], expectedProfileDir);
		});
	});
});

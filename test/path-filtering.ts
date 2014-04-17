///<reference path=".d.ts"/>

import chai = require("chai");
import yok = require("../lib/yok");
import stubs = require("./stubs");
var assert:chai.Assert = chai.assert;
var pfs = require("../lib/services/path-filtering");

var testInjector = new yok.Yok();
testInjector.register("fs", stubs.FileSystemStub);
testInjector.register("pathFilteringService", pfs.PathFilteringService);

describe("PathFilteringService", () => {
	it("test ** rule", () => {
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles([".DS_Store", "allow", "x/.DS_Store", "x/.DS_Storez", "x/z.DS_Store", "x/.DS_Store/z"], ["**/.DS_Store"]);
		var expected = ["allow", "x/.DS_Storez", "x/z.DS_Store", "x/.DS_Store/z"];
		assert.deepEqual(actual, expected);
	});

	it("test ! rule", () => {
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(["scripts/app.js", "scripts/login.js", "allow"], ["**/scripts/**", "!**/scripts/login.js"]);
		var expected = ["scripts/login.js", "allow"];
		assert.deepEqual(actual, expected);
	});

	it("test \\! rule", () => {
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(["!z", "allow"], ["\\!z"]);
		var expected = ["allow"];
		assert.deepEqual(actual, expected);
	});

	it("test inclusion rule only", () =>{
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(["z", "allow"], ["!z"]);
		var expected = ["z", "allow"];
		assert.deepEqual(actual, expected);
	});

	it("test exclusion by two rules and in subdir", () => {
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(["./A/B/file.txt"], ["./A/B/*", "!./A/B/file.txt", "./A/**/*"]);
		var expected = [];
		assert.deepEqual(actual, expected);
	});
});

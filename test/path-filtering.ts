///<reference path=".d.ts"/>

import chai = require("chai");
import yok = require("../lib/common/yok");
import stubs = require("./stubs");
var assert:chai.Assert = chai.assert;
var pfs = require("../lib/services/path-filtering");

var projectDir = "c:/projectDir/";
var testInjector = new yok.Yok();
testInjector.register("fs", stubs.FileSystemStub);
testInjector.register("pathFilteringService", pfs.PathFilteringService);

function prefixWithProjectDir(files: string[]): string[] {
	return _.map(files, (file: string) => projectDir + file);
}

describe("PathFilteringService", () => {
	it("test ignore single file", () => {
		var projectFiles = prefixWithProjectDir([".DS_Store", "allow", "x/.DS_Store", "x/.DS_Storez", "x/z.DS_Store", "x/.DS_Store/z.css"]);
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["x/.DS_Store/z.css"], projectDir);
		var expected = _.reject(projectFiles, file => file.replace(projectDir, "") === "x/.DS_Store/z.css");
		assert.deepEqual(actual, expected);
	});

	it("test ** rule", () => {
		var projectFiles = prefixWithProjectDir([".DS_Store", "allow", "x/.DS_Store", "x/.DS_Storez", "x/z.DS_Store", "x/.DS_Store/z"]);
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["**/.DS_Store"], projectDir);
		var expected = _.reject(projectFiles, file => _.contains([".DS_Store", "x/.DS_Store"], file.replace(projectDir, "")))
		assert.deepEqual(actual, expected);
	});

	it("test ! rule", () => {
		var projectFiles = prefixWithProjectDir(["scripts/app.js", "scripts/login.js", "allow"]);
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["**/scripts/**", "!**/scripts/login.js"], projectDir);
		var expected = _.reject(projectFiles, file => file.replace(projectDir, "") === "scripts/app.js")
		assert.deepEqual(actual, expected);
	});

	it("test \\! rule", () => {
		var projectFiles = prefixWithProjectDir(["!z", "allow"]);
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["\\!z"], projectDir);
		var expected = _.reject(projectFiles, file => file.replace(projectDir, "") === "!z")
		assert.deepEqual(actual, expected);
	});

	it("test inclusion rule only", () => {
		var projectFiles = prefixWithProjectDir(["z", "allow"]);
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["!z"], projectDir);
		var expected = projectFiles;
		assert.deepEqual(actual, expected);
	});

	it("test exclusion by two rules and in subdir", () => {
		var projectFiles = prefixWithProjectDir(["A/B/file.txt"]);
		var actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["A/B/*", "!A/B/file.txt", "A/**/*"], projectDir);
		var expected:string[] = [];
		assert.deepEqual(actual, expected);
	});

	it("different OS line endings -> \\n", () => {
		var fs: IFileSystem = testInjector.resolve("fs");
		var ignoreRules = "a\nb";
		fs.readText = () => ((_:string) => ignoreRules).future<string>()();

		var actual = testInjector.resolve("pathFilteringService").getRulesFromFile("<ignored>");
		var expected = ["a","b"];
		assert.deepEqual(actual, expected);
	});

	it("different OS line endings -> \\r", () => {
		var fs = testInjector.resolve("fs");
		var ignoreRules = "a\rb";
		fs.readText = () => (() => ignoreRules).future<string>()();

		var actual = testInjector.resolve("pathFilteringService").getRulesFromFile("<ignored>");
		var expected = ["a","b"];
		assert.deepEqual(actual, expected);
	});

	it("different OS line endings -> \\r\\n", () => {
		var fs = testInjector.resolve("fs");
		var ignoreRules = "a\r\nb";
		fs.readText = () => (() => ignoreRules).future<string>()();

		var actual = testInjector.resolve("pathFilteringService").getRulesFromFile("<ignored>");
		var expected = ["a","b"];
		assert.deepEqual(actual, expected);
	});
});

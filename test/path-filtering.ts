
import chai = require("chai");
import yok = require("../lib/common/yok");
import stubs = require("./stubs");
let assert:chai.Assert = chai.assert;
let pfs = require("../lib/common/appbuilder/services/path-filtering");

let projectDir = "c:/projectDir/";
let testInjector = new yok.Yok();
testInjector.register("fs", stubs.FileSystemStub);
testInjector.register("pathFilteringService", pfs.PathFilteringService);

function prefixWithProjectDir(files: string[]): string[] {
	return _.map(files, (file: string) => projectDir + file);
}

describe("PathFilteringService", () => {
	it("test ignore single file", () => {
		let projectFiles = prefixWithProjectDir([".DS_Store", "allow", "x/.DS_Store", "x/.DS_Storez", "x/z.DS_Store", "x/.DS_Store/z.css"]);
		let actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["x/.DS_Store/z.css"], projectDir);
		let expected = _.reject(projectFiles, file => file.replace(projectDir, "") === "x/.DS_Store/z.css");
		assert.deepEqual(actual, expected);
	});

	it("test ** rule", () => {
		let projectFiles = prefixWithProjectDir([".DS_Store", "allow", "x/.DS_Store", "x/.DS_Storez", "x/z.DS_Store", "x/.DS_Store/z"]);
		let actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["**/.DS_Store"], projectDir);
		let expected = _.reject(projectFiles, file => _.includes([".DS_Store", "x/.DS_Store"], file.replace(projectDir, "")));
		assert.deepEqual(actual, expected);
	});

	it("test ! rule", () => {
		let projectFiles = prefixWithProjectDir(["scripts/app.js", "scripts/login.js", "allow"]);
		let actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["**/scripts/**", "!**/scripts/login.js"], projectDir);
		let expected = _.reject(projectFiles, file => file.replace(projectDir, "") === "scripts/app.js");
		assert.deepEqual(actual, expected);
	});

	it("test \\! rule", () => {
		let projectFiles = prefixWithProjectDir(["!z", "allow"]);
		let actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["\\!z"], projectDir);
		let expected = _.reject(projectFiles, file => file.replace(projectDir, "") === "!z");
		assert.deepEqual(actual, expected);
	});

	it("test inclusion rule only", () => {
		let projectFiles = prefixWithProjectDir(["z", "allow"]);
		let actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["!z"], projectDir);
		let expected = projectFiles;
		assert.deepEqual(actual, expected);
	});

	it("test exclusion by two rules and in subdir", () => {
		let projectFiles = prefixWithProjectDir(["A/B/file.txt"]);
		let actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["A/B/*", "!A/B/file.txt", "A/**/*"], projectDir);
		let expected:string[] = [];
		assert.deepEqual(actual, expected);
	});

	it("different OS line endings -> \\n", () => {
		let fs: IFileSystem = testInjector.resolve("fs");
		let ignoreRules = "a\nb";
		fs.readText = () => ignoreRules;

		let actual = testInjector.resolve("pathFilteringService").getRulesFromFile("<ignored>");
		let expected = ["a","b"];
		assert.deepEqual(actual, expected);
	});

	it("different OS line endings -> \\r", () => {
		let fs = testInjector.resolve("fs");
		let ignoreRules = "a\rb";
		fs.readText = () => ignoreRules;

		let actual = testInjector.resolve("pathFilteringService").getRulesFromFile("<ignored>");
		let expected = ["a","b"];
		assert.deepEqual(actual, expected);
	});

	it("different OS line endings -> \\r\\n", () => {
		let fs = testInjector.resolve("fs");
		let ignoreRules = "a\r\nb";
		fs.readText = () => ignoreRules;

		let actual = testInjector.resolve("pathFilteringService").getRulesFromFile("<ignored>");
		let expected = ["a","b"];
		assert.deepEqual(actual, expected);
	});

	it("ignore .files", () => {
		let projectFiles = prefixWithProjectDir(["test/A", "test/.B", "test/C"]);
		let actual = testInjector.resolve("pathFilteringService").filterIgnoredFiles(projectFiles, ["test/**/*"], projectDir);
		let expected: string[] = [];
		assert.deepEqual(actual, expected);
	});
});

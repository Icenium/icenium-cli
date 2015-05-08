///<reference path=".d.ts"/>
"use strict";

import yok = require("../lib/common/yok");

import Future = require("fibers/future");
import stubs = require("./stubs");
import path = require("path");
import temp = require("temp");
import util = require("util");
import hostInfo = require("../lib/common/host-info");
let assert = require("chai").assert;

let fileSystemFile = require("../lib/common/file-system");
let cordovaBlankTemplateZipFile = path.join(__dirname, "../resources/ProjectTemplates/Telerik.Mobile.Cordova.Blank.zip");
let cordovaBlankTemplateZipFileIncorrectName = path.join(__dirname, "../resources/ProjectTemplates/Telerik.Mobile.Cordova.blank.zip");
import childProcessLib = require("../lib/common/child-process");
import staticConfigLib = require("../lib/config");
let isOsCaseInsensitive = hostInfo.isLinux();
temp.track();

function createTestInjector(): IInjector {
	let testInjector = new yok.Yok();

	testInjector.register("fs", fileSystemFile.FileSystem);
	testInjector.register("errors", {
		fail: (...args: any[]) => { throw new Error(args[0]); }
	});

	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("childProcess", childProcessLib.ChildProcess);
	testInjector.register("staticConfig", staticConfigLib.StaticConfig);
	return testInjector;
}

describe("FileSystem", () => {
	describe("unzip",() => {
		describe("overwriting files tests",() => {
			it("does not overwrite files when overwriteExisitingFiles is false",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				let msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, { overwriteExisitingFiles: false }, [".abproject"]).wait();
				let data = fs.readFile(file).wait();
				assert.strictEqual(msg, data.toString(), "When overwriteExistingFiles is false, we should not ovewrite files.");
			});

			it("overwrites files when overwriteExisitingFiles is true",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				let msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, { overwriteExisitingFiles: true }, [".abproject"]).wait();
				let data = fs.readFile(file).wait();
				assert.notEqual(msg, data.toString(), "We must overwrite files when overwriteExisitingFiles is true.");
			});

			it("overwrites files when overwriteExisitingFiles is not set",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				let msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, {}, [".abproject"]).wait();
				let data = fs.readFile(file).wait();
				assert.notEqual(msg, data.toString(), "We must overwrite files when overwriteExisitingFiles is not set.");
			});

			it("overwrites files when options is not set",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				let msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, undefined, [".abproject"]).wait();
				let data = fs.readFile(file).wait();
				assert.notEqual(msg, data.toString(), "We must overwrite files when options is not defined.");
			});
		});

		// NOTE: This tests will never fail on Windows/Mac as file system is case insensitive
		describe("case sensitive tests",() => {
			it("is case sensitive when options is not defined",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				if(isOsCaseInsensitive) {
					assert.throws(() => fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, undefined, [".abproject"]).wait());
				}
			});

			it("is case sensitive when caseSensitive option is not defined",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				if(isOsCaseInsensitive) {
					assert.throws(() => fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, {}, [".abproject"]).wait());
				}
			});

			it("is case sensitive when caseSensitive option is true",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				if(isOsCaseInsensitive) {
					assert.throws(() => fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, { caseSensitive: true }, [".abproject"]).wait());
				}
			});

			it("is case insensitive when caseSensitive option is false",() => {
				let testInjector = createTestInjector();
				let tempDir = temp.mkdirSync("projectToUnzip");
				let fs: IFileSystem = testInjector.resolve("fs");
				let file = path.join(tempDir, ".abproject");
				fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, { caseSensitive: false }, [".abproject"]).wait();
				// This will throw error in case file is not extracted
				let data = fs.readFile(file).wait();
			});
		});
	});
});
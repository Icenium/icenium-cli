///<reference path=".d.ts"/>
"use strict";

import yok = require("../lib/common/yok");

import Future = require("fibers/future");
import stubs = require("./stubs");
import path = require("path");
import temp = require("temp");
import util = require("util");
import hostInfo = require("../lib/common/host-info");
var assert = require("chai").assert;

var fileSystemFile = require("../lib/common/file-system");
var cordovaBlankTemplateZipFile = path.join(__dirname, "../resources/ProjectTemplates/Telerik.Mobile.Cordova.Blank.zip");
var cordovaBlankTemplateZipFileIncorrectName = path.join(__dirname, "../resources/ProjectTemplates/Telerik.Mobile.Cordova.blank.zip");
import childProcessLib = require("../lib/common/child-process");
import staticConfigLib = require("../lib/config");
var isOsCaseInsensitive = hostInfo.isLinux();
temp.track();

function createTestInjector(): IInjector {
	var testInjector = new yok.Yok();

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
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				var msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, { overwriteExisitingFiles: false }, [".abproject"]).wait();
				var data = fs.readFile(file).wait();
				assert.strictEqual(msg, data.toString(), "When overwriteExistingFiles is false, we should not ovewrite files.");
			});

			it("overwrites files when overwriteExisitingFiles is true",() => {
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				var msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, { overwriteExisitingFiles: true }, [".abproject"]).wait();
				var data = fs.readFile(file).wait();
				assert.notEqual(msg, data.toString(), "We must overwrite files when overwriteExisitingFiles is true.");
			});

			it("overwrites files when overwriteExisitingFiles is not set",() => {
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				var msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, {}, [".abproject"]).wait();
				var data = fs.readFile(file).wait();
				assert.notEqual(msg, data.toString(), "We must overwrite files when overwriteExisitingFiles is not set.");
			});

			it("overwrites files when options is not set",() => {
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				var msg = "data";
				fs.writeFile(file, msg).wait();
				fs.unzip(cordovaBlankTemplateZipFile, tempDir, undefined, [".abproject"]).wait();
				var data = fs.readFile(file).wait();
				assert.notEqual(msg, data.toString(), "We must overwrite files when options is not defined.");
			});
		});

		// NOTE: This tests will never fail on Windows/Mac as file system is case insensitive
		describe("case sensitive tests",() => {
			it("is case sensitive when options is not defined",() => {
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				if(isOsCaseInsensitive) {
					assert.throws(() => fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, undefined, [".abproject"]).wait());
				}
			});

			it("is case sensitive when caseSensitive option is not defined",() => {
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				if(isOsCaseInsensitive) {
					assert.throws(() => fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, {}, [".abproject"]).wait());
				}
			});

			it("is case sensitive when caseSensitive option is true",() => {
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				if(isOsCaseInsensitive) {
					assert.throws(() => fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, { caseSensitive: true }, [".abproject"]).wait());
				}
			});

			it("is case insensitive when caseSensitive option is false",() => {
				var testInjector = createTestInjector();
				var tempDir = temp.mkdirSync("projectToUnzip");
				var fs: IFileSystem = testInjector.resolve("fs");
				var file = path.join(tempDir, ".abproject");
				fs.unzip(cordovaBlankTemplateZipFileIncorrectName, tempDir, { caseSensitive: false }, [".abproject"]).wait();
				// This will throw error in case file is not extracted
				var data = fs.readFile(file).wait();
			});
		});
	});
});
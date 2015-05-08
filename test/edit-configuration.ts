///<reference path=".d.ts"/>
"use strict";

import chai = require("chai");
import fs = require("fs");
import path = require("path");
import Future = require("fibers/future");
import stubs = require("./stubs");
import childProcess = require("../lib/common/child-process");
import fileSystem = require("../lib/common/file-system");
import project = require("../lib/project");
import options = require("../lib/common/options");
import editConfiguration = require("../lib/commands/edit-configuration");
import yok = require("../lib/common/yok");
import config = require("../lib/config");
import helpers = require("../lib/helpers");
import os = require("os");
import temp = require("temp");
temp.track();
let assert: chai.Assert = chai.assert;

function createTestInjector() {
	let testInjector = new yok.Yok();
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("childProcess", childProcess.ChildProcess);
	testInjector.register("fs", fileSystem.FileSystem);
	testInjector.register("project", {
		getProjectDir: (): IFuture<string> => {
			return (() => options.path).future<string>()();
		},
		ensureProject: () => {},
		projectConfigFiles: [{ template: "android-manifest",
			filepath: "App_Resources/Android/AndroidManifest.xml",
			templateFilepath: "Mobile.Cordova.Android.ManifestXml.zip",
			helpText: "" }]
	});
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("opener", stubs.OpenerStub);
	testInjector.register("templatesService", stubs.TemplateServiceStub);
	testInjector.register("staticConfig", config.StaticConfig);

	return testInjector;
}

function setTempDir(): string {
	let tempDir = temp.mkdirSync("edit-configuration");
	options.path = tempDir;
	return tempDir;
}

describe("edit-configuration", () => {

	it("throws error when no parameter is given", () => {
		setTempDir();
		let testInjector = createTestInjector();
	 	let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		assert.throws(() => command.execute([]).wait());
	});

	it("throws error when wrong configuration file is given", () => {
		setTempDir();
		let testInjector = createTestInjector();
		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		assert.throws(() => command.execute(["wrong"]).wait());
	});

	it("creates and opens file if correct configuration file is given and it doesn't exist", () => {
		let testInjector = createTestInjector();
		let tempDir = setTempDir();
		let template = testInjector.resolve("project").projectConfigFiles[0];
		let openArgument: string;
		let opener: IOpener = testInjector.resolve("opener");
		opener.open = (filepath: string): void => {
			openArgument = filepath;
		};
		let templateFilepath = path.join(tempDir, template.filepath);
		testInjector.resolve("fs").createDirectory(path.dirname(templateFilepath)).wait();

		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		command.execute([template.template]).wait();

		assert.equal(openArgument, templateFilepath);
		assert.isTrue(fs.existsSync(templateFilepath));
	});

	it("doesn't modify file if correct configuration file is given and it exists", () => {
		let testInjector = createTestInjector();
		let tempDir = setTempDir();
		let template = testInjector.resolve("project").projectConfigFiles[0];
		let openArgument: string;
		let opener: IOpener = testInjector.resolve("opener");
		opener.open = (filepath: string): void => {
			openArgument = filepath;
		};

		let templateFilePath = path.join(tempDir, template.filepath);
		testInjector.resolve("fs").createDirectory(path.dirname(templateFilePath)).wait();

		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		command.execute([template.template]).wait();

		let templatesService = testInjector.resolve("templatesService");
		testInjector.resolve("fs").unzip( path.join(templatesService.itemTemplatesDir, template.templateFilepath), tempDir).wait();

		let expectedContent = fs.readFileSync(path.join(tempDir, "AndroidManifest.xml")).toString();
		expectedContent = helpers.stringReplaceAll(expectedContent, "\n", "");

		let actualContent = fs.readFileSync(templateFilePath).toString();
		actualContent = helpers.stringReplaceAll(actualContent, os.EOL, "");

		assert.equal(openArgument, templateFilePath);
		assert.isTrue(fs.existsSync(templateFilePath));
		assert.equal(actualContent, expectedContent);
	});
});

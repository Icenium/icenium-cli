///<reference path=".d.ts"/>
"use strict";

import chai = require("chai");
import fs = require("fs");
import * as path from "path";
import stubs = require("./stubs");
import childProcess = require("../lib/common/child-process");
import fileSystem = require("../lib/common/file-system");
import optionsPath = require("../lib/options");
import editConfiguration = require("../lib/commands/edit-configuration");
import yok = require("../lib/common/yok");
import config = require("../lib/config");
import helpers = require("../lib/helpers");
import hostInfoLib = require("../lib/common/host-info");
import {EOL} from "os";
import temp = require("temp");
temp.track();
let assert: chai.Assert = chai.assert;

function createTestInjector() {
	let testInjector = new yok.Yok();

	testInjector.register("options", optionsPath.Options);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("childProcess", childProcess.ChildProcess);
	testInjector.register("fs", fileSystem.FileSystem);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);

	testInjector.register("project", {
		getProjectDir: (): IFuture<string> => {
			return (() => testInjector.resolve("options").path).future<string>()();
		},
		ensureProject: () => { /* mock*/},
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

function setTempDir(testInjector: IInjector): string {
	let tempDir = temp.mkdirSync("edit-configuration");
	testInjector.resolve("options").path = tempDir;
	return tempDir;
}

describe("edit-configuration", () => {

	it("throws error when no parameter is given", () => {
		let testInjector = createTestInjector();
		setTempDir(testInjector);
		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		assert.throws(() => command.execute([]).wait());
	});

	it("throws error when wrong configuration file is given", () => {
		let testInjector = createTestInjector();
		setTempDir(testInjector);
		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		assert.throws(() => command.execute(["wrong"]).wait());
	});

	it("creates and opens file if correct configuration file is given and it doesn't exist", () => {
		let testInjector = createTestInjector();
		let tempDir = setTempDir(testInjector);
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
		let tempDir = setTempDir(testInjector);
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
		actualContent = helpers.stringReplaceAll(actualContent, EOL, "");

		assert.equal(openArgument, templateFilePath);
		assert.isTrue(fs.existsSync(templateFilePath));
		assert.equal(actualContent, expectedContent);
	});
});

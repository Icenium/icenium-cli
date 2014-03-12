///<reference path=".d.ts"/>

import chai = require("chai");
import fs = require("fs");
import path = require("path");
import stubs = require("./stubs");
import fileSystem = require("../lib/file-system");
import project = require("../lib/project");
import options = require("../lib/options");
import editConfiguration = require("../lib/commands/edit-configuration");
import yok = require("../lib/yok");
import temp = require("temp");
temp.track();
var assert: chai.Assert = chai.assert;

var testInjector = new yok.Yok();
testInjector.register("logger", stubs.LoggerStub);
testInjector.register("fs", fileSystem.FileSystem);
testInjector.register("project", {
	getProjectDir: () => { return options.path; },
	ensureProject: () => {}
});
testInjector.register("errors", stubs.ErrorsStub);
testInjector.register("opener", stubs.OpenerStub);
testInjector.register("templatesService", stubs.TemplateServiceStub);

function getEditConfigurationCommand() {
	return testInjector.resolve(editConfiguration.EditConfigurationCommand);
}

function setTempDir(): string {
	var tempDir = temp.mkdirSync("edit-configuration");
	options.path = tempDir;
	return tempDir;
}

describe("edit-configuration", function () {

	it("throws error when no parameter is given", () => {
		setTempDir();
		var command = getEditConfigurationCommand();
		assert.throws(() => command.execute([]).wait());
	});

	it("throws error when wrong configuration file is given", () => {
		setTempDir();
		var command = getEditConfigurationCommand();
		assert.throws(() => command.execute(["wrong"]).wait());
	});

	it("creates and opens file if correct configuration file is given and it doesn't exist", () => {
		var tempDir = setTempDir();
		var template = testInjector.resolve("templatesService").configurationFiles[0];
		var openArgument;
		var opener: IOpener = testInjector.resolve("opener");
		opener.open = (filepath: string): void => {
			openArgument = filepath;
		}
		var templateFilepath = path.join(tempDir, template.filepath);

		var command = getEditConfigurationCommand();
		command.execute([template.template]).wait();
		assert.equal(openArgument, templateFilepath);
		assert.isTrue(fs.existsSync(templateFilepath));
	});

	it("opens and doesn't modify file if correct configuration file is given and it exists", () => {
		var tempDir = setTempDir();
		var template = testInjector.resolve("templatesService").configurationFiles[0];
		var openArgument;
		var opener: IOpener = testInjector.resolve("opener");
		opener.open = (filepath: string): void => {
			openArgument = filepath;
		}

		var templateFilePath = path.join(tempDir, template.filepath);
		testInjector.resolve("fs").createDirectory(path.dirname(templateFilePath)).wait();
		fs.openSync(templateFilePath, "w", "0666");

		var command = getEditConfigurationCommand();
		command.execute([template.template]).wait();
		assert.equal(openArgument, templateFilePath);
		assert.isTrue(fs.existsSync(templateFilePath));
		assert.equal(fs.readFileSync(templateFilePath).toString(), "");
	});
});

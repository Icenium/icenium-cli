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
import { EOL } from "os";
import { assert } from "chai";
import temp = require("temp");
temp.track();

function createTestInjector() {
	let testInjector = new yok.Yok();

	testInjector.register("options", optionsPath.Options);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("childProcess", childProcess.ChildProcess);
	testInjector.register("fs", fileSystem.FileSystem);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);

	testInjector.register("project", {
		getProjectDir: (): string => {
			return testInjector.resolve("options").path;
		},
		ensureProject: () => { /* mock*/ },
		projectConfigFiles: [{
			template: "android-manifest",
			filepath: "App_Resources/Android/AndroidManifest.xml",
			templateFilepath: "Mobile.Cordova.Android.ManifestXml.zip",
			helpText: ""
		}]
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

	it("throws error when no parameter is given", async () => {
		let testInjector = createTestInjector();
		setTempDir(testInjector);
		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		await assert.isRejected(command.execute([]));
	});

	it("throws error when wrong configuration file is given", async () => {
		let testInjector = createTestInjector();
		setTempDir(testInjector);
		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		await assert.isRejected(command.execute(["wrong"]));
	});

	it("creates and opens file if correct configuration file is given and it doesn't exist", async () => {
		let testInjector = createTestInjector();
		let tempDir = setTempDir(testInjector);
		let template = testInjector.resolve("project").projectConfigFiles[0];
		let openArgument: string;
		let opener: IOpener = testInjector.resolve("opener");
		opener.open = (filepath: string): void => {
			openArgument = filepath;
		};
		let templateFilepath = path.join(tempDir, template.filepath);
		testInjector.resolve("fs").createDirectory(path.dirname(templateFilepath));

		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		await command.execute([template.template]);

		assert.equal(openArgument, templateFilepath);
		assert.isTrue(fs.existsSync(templateFilepath));
	});

	it("only creates file if correct configuration file is given that doesn't exist and --skipUi is passed", async () => {
		let testInjector = createTestInjector();
		let tempDir = setTempDir(testInjector);
		let template = testInjector.resolve("project").projectConfigFiles[0];
		let openArgument: string;
		let opener: IOpener = testInjector.resolve("opener");
		opener.open = (filepath: string): void => {
			openArgument = filepath;
		};
		let templateFilepath = path.join(tempDir, template.filepath);
		testInjector.resolve("fs").createDirectory(path.dirname(templateFilepath));

		let options: IOptions = testInjector.resolve("options");
		options.skipUi = true;

		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		await command.execute([template.template]);

		assert.deepEqual(openArgument, undefined, "When skipUi option is passed, opener should not be called");
		assert.isTrue(fs.existsSync(templateFilepath));
	});

	it("doesn't modify file if correct configuration file is given and it exists", async () => {
		let testInjector = createTestInjector();
		let tempDir = setTempDir(testInjector);
		let template = testInjector.resolve("project").projectConfigFiles[0];
		let openArgument: string;
		let opener: IOpener = testInjector.resolve("opener");
		opener.open = (filepath: string): void => {
			openArgument = filepath;
		};

		let templateFilePath = path.join(tempDir, template.filepath);
		testInjector.resolve("fs").createDirectory(path.dirname(templateFilePath));

		let command = testInjector.resolve(editConfiguration.EditConfigurationCommand);
		await command.execute([template.template]);

		let templatesService = testInjector.resolve("templatesService");
		await testInjector.resolve("fs").unzip(path.join(templatesService.itemTemplatesDir, template.templateFilepath), tempDir);

		let expectedContent = fs.readFileSync(path.join(tempDir, "AndroidManifest.xml")).toString();
		expectedContent = helpers.stringReplaceAll(expectedContent, "\n", "");

		let actualContent = fs.readFileSync(templateFilePath).toString();
		actualContent = helpers.stringReplaceAll(actualContent, EOL, "");

		assert.equal(openArgument, templateFilePath);
		assert.isTrue(fs.existsSync(templateFilePath));
		assert.equal(actualContent, expectedContent);
	});
});

///<reference path=".d.ts"/>
"use strict";

import projectlib = require("./../lib/project");
import fslib = require("./../lib/common/file-system");
import projectPropertiesLib = require("../lib/services/project-properties-service");
import yok = require("./../lib/common/yok");
import stubs = require("./stubs");
import fs = require("fs");
import path = require("path");
import temp = require("temp");
import options = require("./../lib/options");
import helpers = require("../lib/helpers");
import projectTypes = require("../lib/project-types");
var assert = require("chai").assert;
temp.track();

var mockProjectNameValidator = {
	validateCalled: false,
	validate: () => {
		mockProjectNameValidator.validateCalled = true;
		return true;
	}
};

function createTestInjector(): IInjector {
	require("../lib/common/logger");

	var testInjector = new yok.Yok();
	testInjector.register("project", projectlib.Project);

	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("injector", testInjector);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("opener", stubs.OpenerStub);
	testInjector.register("config", require("../lib/config").Configuration);
	testInjector.register("staticConfig", require("../lib/config").StaticConfig);
	testInjector.register("server", {});
	testInjector.register("identityManager", {});
	testInjector.register("buildService", {});
	testInjector.register("projectNameValidator", mockProjectNameValidator);
	testInjector.register("loginManager", stubs.LoginManager);
	testInjector.register("templatesService", stubs.TemplateServiceStub);
	testInjector.register("userDataStore", {});
	testInjector.register("qr", {});
	testInjector.register("cordovaMigrationService", require("../lib/services/cordova-migration-service").CordovaMigrationService);
	testInjector.register("resources", $injector.resolve("resources"));
	testInjector.register("pathFilteringService", stubs.PathFilteringServiceStub);

	return testInjector;
}

describe("project integration tests", () => {
	var project: Project.IProject, testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);
		project = testInjector.resolve("project");
	});

	describe("createNewProject", () => {
		it("creates a valid project folder (Cordova project)", () => {
			var options: any = require("./../lib/options");
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";

			project.createNewProject(projectTypes.Cordova, projectName).wait();

			var abProject = fs.readFileSync(path.join(tempFolder, projectName, ".abproject"));
			var correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-Cordova.abproject"));
			var testProperties = JSON.parse(abProject.toString());
			var correctProperties = JSON.parse(correctABProject.toString());

			var projectSchema = helpers.getProjectFileSchema(projectTypes.Cordova).wait();
			var guidRegex = new RegExp(projectSchema.WP8ProductID.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;
			assert.ok(guidRegex.test(testProperties.WP8ProductID));
			delete testProperties.WP8ProductID;
			assert.ok(guidRegex.test(testProperties.WP8PublisherID));
			delete testProperties.WP8PublisherID;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for (var key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});

		it("creates a valid project folder (NativeScript project)", () => {
			var options: any = require("./../lib/options");
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";

			project.createNewProject(projectTypes.NativeScript, projectName).wait();
			var abProject = fs.readFileSync(path.join(tempFolder, projectName, ".abproject"));
			var correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-NativeScript.abproject"));
			var testProperties = JSON.parse(abProject.toString());
			var correctProperties = JSON.parse(correctABProject.toString());

			var projectSchema = helpers.getProjectFileSchema(projectTypes.NativeScript).wait();
			var guidRegex = new RegExp(projectSchema.WP8ProductID.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;
			assert.ok(guidRegex.test(testProperties.WP8ProductID));
			delete testProperties.WP8ProductID;
			assert.ok(guidRegex.test(testProperties.WP8PublisherID));
			delete testProperties.WP8PublisherID;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for (var key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});
	});

	describe("createTemplateFolder", () => {
		it("creates project folder when folder with that name doesn't exists", () => {
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";
			var projectFolder = path.join(tempFolder, projectName);

			project.createTemplateFolder(projectFolder).wait();
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("doesn't fail when folder with that name exists and it's empty", () => {
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";
			var projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			project.createTemplateFolder(projectFolder).wait();
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("fails when project folder is not empty", () => {
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";
			var projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			fs.openSync(path.join(projectFolder, "temp"), "a", "0666");
			assert.throws(() => project.createTemplateFolder(projectFolder).wait());
		});
	});
});

describe("project unit tests", () => {
	var project: Project.IProject, projectProperties: IProjectPropertiesService,  testInjector: IInjector, propSchemaCordova: any;
	before(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);

		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		var config = testInjector.resolve("config");
		var staticConfig = testInjector.resolve("staticConfig");
		staticConfig.PROJECT_FILE_NAME = "";
		config.AUTO_UPGRADE_PROJECT_FILE = false;

		project = testInjector.resolve("project");
		projectProperties = testInjector.resolve("projectPropertiesService");
		propSchemaCordova = helpers.getProjectFileSchema(projectTypes.Cordova).wait();
	});

	describe("updateProjectProperty", () => {
		it("sets unconstrained string property", () => {
			var projectData = {DisplayName: "wrong"};
			projectProperties.updateProjectProperty(projectData, "set", "DisplayName", ["fine"], propSchemaCordova).wait();
			assert.equal("fine", projectData.DisplayName);
		});

		it("sets string property with custom validator", () => {
			var projectData = {ProjectName: "wrong"};
			projectProperties.updateProjectProperty(projectData, "set", "ProjectName", ["fine"], propSchemaCordova).wait();
			assert.equal("fine", projectData.ProjectName);
			assert.ok(mockProjectNameValidator.validateCalled);
		});

		it("disallows 'add' on non-flag property", () => {
			var projectData = {ProjectName: "wrong"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "ProjectName", ["fine"], propSchemaCordova).wait());
		});

		it("disallows 'del' on non-flag property", () => {
			var projectData = {ProjectName: "wrong"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "del", "ProjectName", ["fine"], propSchemaCordova).wait());
		});

		it("sets bundle version when given proper input", () => {
			var projectData = {"BundleVersion": "0"};
			projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30"], propSchemaCordova).wait();
			assert.equal("10.20.30", projectData.BundleVersion);
		});

		it("throws on invalid bundle version string", () => {
			var projectData = {"BundleVersion": "0"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30c"], propSchemaCordova).wait());
		});

		it("sets enumerated property", () => {
			var projectData = {iOSStatusBarStyle: "Default"};
			projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["Hidden"], propSchemaCordova).wait();
			assert.equal("Hidden", projectData.iOSStatusBarStyle);
		});

		it("disallows unrecognized values for enumerated property", () => {
			var projectData = {iOSStatusBarStyle: "Default"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["does not exist"], propSchemaCordova).wait());
		});

		it("appends to verbatim enumerated collection property", () => {
			var projectData: any = {DeviceOrientations: []};
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Portrait"], propSchemaCordova).wait();
			assert.deepEqual(["Portrait"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape", "Portrait"], projectData.DeviceOrientations);
		});

		it("appends to enumerated collection property with shorthand", () => {
			var projectData: any = {iOSDeviceFamily: []};
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPhone"], propSchemaCordova).wait();
			assert.deepEqual(["1"], projectData.iOSDeviceFamily);
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPad"], propSchemaCordova).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("appends multiple values to enumerated collection property", () => {
			var projectData: any = {iOSDeviceFamily: []};
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPhone", "iPad"], propSchemaCordova).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("removes from enumerated collection property", () => {
			var projectData: any = {DeviceOrientations: ["Landscape", "Portrait"]};
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("disallows unrecognized values for enumerated collection property", () => {
			var projectData: any = {DeviceOrientations: []};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape", "bar"], propSchemaCordova).wait());
		});

		it("makes case-insensitive comparisons of property name", () => {
			var projectData: any = {DeviceOrientations: []};
			projectProperties.updateProjectProperty(projectData, "add", "deviceorientations", ["Landscape"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("makes case-insensitive comparisons of property values", () => {
			var projectData: any = {DeviceOrientations: []};
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["landscape"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});
	});
});

describe("project unit tests (canonical paths)", () => {
	var project: Project.IProject, testInjector: IInjector, oldPath: string;
	before(() => {
		testInjector = createTestInjector();
		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);
		testInjector.resolve("staticConfig").PROJECT_FILE_NAME = "";
		oldPath = options.path;
	});
	after(() => {
		options.path = oldPath;
	});

	it("no ending path separator", () => {
		options.path = "test";
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test"));
	});

	it("one ending path separator", () => {
		options.path = "test" + path.sep;
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test"));
	});

	it("multiple ending path separator", () => {
		options.path = "test" + path.sep + path.sep;
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test"));
	});

	it("do not remove separators which are not at the end", () => {
		options.path = "test" + path.sep + "test" + path.sep;
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test" + path.sep + "test"));
	});
});

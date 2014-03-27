///<reference path=".d.ts"/>

"use strict";

import projectlib = require("./../lib/project");
import fslib = require("./../lib/file-system");
import yok = require("./../lib/yok");
import stubs = require("./stubs");
import fs = require("fs");
import path = require("path");
import temp = require("temp");
import options = require("./../lib/options");
import helpers = require("../lib/helpers");
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
	require("../lib/logger");

	var testInjector = new yok.Yok();
	testInjector.register("project", projectlib.Project);

	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("injector", testInjector);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("opener", stubs.OpenerStub);
	testInjector.register("config", require("../lib/config").Configuration);
	testInjector.register("server", {});
	testInjector.register("identityManager", {});
	testInjector.register("buildService", {});
	testInjector.register("projectNameValidator", mockProjectNameValidator);
	testInjector.register("loginManager", stubs.LoginManager);
	testInjector.register("templatesService", stubs.TemplateServiceStub);
	testInjector.register("userDataStore", {});
	testInjector.register("qr", {});
	testInjector.register("resources", $injector.resolve("resources"));
	testInjector.register("pathFilteringService", stubs.PathFilteringServiceStub);

	return testInjector;
}

describe("project integration tests", function() {
	var project, testInjector;
	before(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);
		project = testInjector.resolve("project");
	});

	describe("createNewProject", function () {
		it("creates a valid project folder", function () {
			var options: any = require("./../lib/options");
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";

			project.createNewProject(projectName).wait();

			var abProject = fs.readFileSync(path.join(tempFolder, projectName, ".abproject"));
			var correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank.abproject"));
			var testProperties = JSON.parse(abProject.toString());
			var correctProperties = JSON.parse(correctABProject.toString());

			var projectSchema = helpers.getProjectFileSchema();
			var guidRegex = new RegExp(projectSchema.WP8ProductID.regex);

			assert.ok(guidRegex.test(testProperties.WP8ProductID));
			delete testProperties.WP8ProductID;
			assert.ok(guidRegex.test(testProperties.WP8PublisherID));
			delete testProperties.WP8PublisherID;

			assert.deepEqual(Object.keys(testProperties), Object.keys(correctProperties));
			for (var key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});
	});

	describe("createTemplateFolder", function () {
		it("creates project folder when folder with that name doesn't exists", function () {
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";
			var projectFolder = path.join(tempFolder, projectName);

			project.createTemplateFolder(projectFolder).wait();
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("doesn't fail when folder with that name exists and it's empty", function () {
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";
			var projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			project.createTemplateFolder(projectFolder).wait();
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("fails when project folder is not empty", function () {
			var tempFolder = temp.mkdirSync("template");
			var projectName = "Test";
			var projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			fs.openSync(path.join(projectFolder, "temp"), "a", "0666");
			assert.throws(function () { project.createTemplateFolder(projectFolder).wait(); });
		});
	});
});

describe("project unit tests", function() {
	var project, testInjector;
	before(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", stubs.FileSystemStub);

		testInjector.register("config", require("../lib/config").Configuration);
		var config = testInjector.resolve("config");
		config.PROJECT_FILE_NAME = "";
		config.AUTO_UPGRADE_PROJECT_FILE = false;

		project = testInjector.resolve("project");
	});

	describe("updateProjectProperty", function() {
		it("sets unconstrained string property", function() {
			var projectData = {DisplayName: "wrong"};
			project.updateProjectProperty(projectData, "set", "DisplayName", ["fine"]);
			assert.equal("fine", projectData.DisplayName);
		});

		it("sets string property with custom validator", function() {
			var projectData = {name: "wrong"};
			project.updateProjectProperty(projectData, "set", "name", ["fine"]);
			assert.equal("fine", projectData.name);
			assert.ok(mockProjectNameValidator.validateCalled);
		});

		it("disallows 'add' on non-flag property", function() {
			var projectData = {name: "wrong"};
			assert.throws(function() {project.updateProjectProperty(projectData, "add", "name", ["fine"]);});
		});

		it("disallows 'del' on non-flag property", function() {
			var projectData = {name: "wrong"};
			assert.throws(function() {project.updateProjectProperty(projectData, "del", "name", ["fine"]);});
		});

		it("sets bundle version when given proper input", function() {
			var projectData = {"BundleVersion": "0"};
			project.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30"]);
			assert.equal("10.20.30", projectData.BundleVersion);
		});

		it("throws on invalid bundle version string", function() {
			var projectData = {"BundleVersion": "0"};
			assert.throws(function() {project.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30c"]);});
		});

		it("sets enumerated property", function() {
			var projectData = {iOSStatusBarStyle: "Default"};
			project.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["Hidden"]);
			assert.equal("Hidden", projectData.iOSStatusBarStyle);
		});

		it("disallows unrecognized values for enumerated property", function() {
			var projectData = {iOSStatusBarStyle: "Default"};
			assert.throws(function() {project.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["does not exist"]);});
		});

		it("appends to verbatim enumerated collection property", function() {
			var projectData = {DeviceOrientations: []};
			project.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Portrait"]);
			assert.deepEqual(["Portrait"], projectData.DeviceOrientations);
			project.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape"]);
			assert.deepEqual(["Landscape", "Portrait"], projectData.DeviceOrientations);
		});

		it("appends to enumerated collection property with shorthand", function() {
			var projectData = {iOSDeviceFamily: []};
			project.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPhone"]);
			assert.deepEqual(["1"], projectData.iOSDeviceFamily);
			project.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPad"]);
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("appends multiple values to enumerated collection property", function() {
			var projectData = {iOSDeviceFamily: []};
			project.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPhone", "iPad"]);
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("removes from enumerated collection property", function() {
			var projectData = {DeviceOrientations: ["Landscape", "Portrait"]};
			project.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
			project.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("disallows unrecognized values for enumerated collection property", function() {
			var projectData = {DeviceOrientations: []};
			assert.throws(function() {project.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape", "bar"]);});
		});

		it("makes case-insensitive comparisons of property name", function() {
			var projectData = {DeviceOrientations: []};
			project.updateProjectProperty(projectData, "add", "deviceorientations", ["Landscape"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("makes case-insensitive comparisons of property values", function() {
			var projectData = {DeviceOrientations: []};
			project.updateProjectProperty(projectData, "add", "DeviceOrientations", ["landscape"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});
	});
});

describe("project unit tests (canonical paths)", function() {
	var project, testInjector;
	before(() => {
		testInjector = createTestInjector();
		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.resolve("config").PROJECT_FILE_NAME = "";
	});

	it("no ending path separator", function() {
		options.path = "test";
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test"));
	});

	it("one ending path separator", function() {
		options.path = "test" + path.sep;
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test"));
	});

	it("multiple ending path separator", function() {
		options.path = "test" + path.sep + path.sep;
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test"));
	});

	it("do not remove separators which are not at the end", function() {
		options.path = "test" + path.sep + "test" + path.sep;
		var project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test" + path.sep + "test"));
	});
});

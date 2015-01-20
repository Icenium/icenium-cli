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
import util = require("util");
import MobileHelper = require("./../lib/common/mobile/mobile-helper");
import options = require("./../lib/options");
import helpers = require("../lib/helpers");
import cordovaProjectLib = require("./../lib/project/cordova-project");
import nativeScriptProjectLib = require("./../lib/project/nativescript-project");
import frameworkProjectResolverLib = require("../lib/project/resolvers/framework-project-resolver");
import projectFilesManagerLib = require("../lib/project/project-files-manager");
import projectConstantsLib = require("../lib/project/project-constants");
var projectConstants = new projectConstantsLib.ProjectConstants();
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
	testInjector.register("frameworkProjectResolver", {
		resolve: (framework: string) => {
			if(!framework || framework === "Cordova") {
				return testInjector.resolve("cordovaProject");
			}
			return testInjector.resolve("nativeScriptProject");
		}
	});
	testInjector.register("cordovaProject", cordovaProjectLib.CordovaProject);
	testInjector.register("nativeScriptProject", nativeScriptProjectLib.NativeScriptProject);
	testInjector.register("serverExtensionsService", {});
	testInjector.register("projectConstants", projectConstantsLib.ProjectConstants);
	testInjector.register("projectFilesManager", projectFilesManagerLib.ProjectFilesManager);

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

			project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();

			var abProject = fs.readFileSync(path.join(tempFolder, projectName, ".abproject"));
			var correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-Cordova.abproject"));
			var testProperties = JSON.parse(abProject.toString());
			var correctProperties = JSON.parse(correctABProject.toString());

			var projectSchema = project.getProjectSchema().wait();
			var guidRegex = new RegExp(projectSchema.WP8ProductID.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;
			assert.ok(guidRegex.test(testProperties.WP8ProductID));
			delete testProperties.WP8ProductID;
			assert.ok(guidRegex.test(testProperties.WP8PublisherID));
			delete testProperties.WP8PublisherID;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for(var key in testProperties) {
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

			project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
			var abProject = fs.readFileSync(path.join(tempFolder, projectName, ".abproject"));
			var correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-NativeScript.abproject"));
			var testProperties = JSON.parse(abProject.toString());
			var correctProperties = JSON.parse(correctABProject.toString());

			var projectSchema = project.getProjectSchema().wait();
			var guidRegex = new RegExp(projectSchema.WP8ProductID.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;
			assert.ok(guidRegex.test(testProperties.WP8ProductID));
			delete testProperties.WP8ProductID;
			assert.ok(guidRegex.test(testProperties.WP8PublisherID));
			delete testProperties.WP8PublisherID;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for(var key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});
	});

	describe("Init command mandatory files tests", () => {
		describe("NativeScript project", () => {
			it("Blank template has all mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "Blank";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				var projectDir = project.getProjectDir().wait();
				var bootstrapJsFile = path.join(projectDir, "app", "bootstrap.js");
				assert.isTrue(fs.existsSync(bootstrapJsFile), "NativeScript Blank template does not contain mandatory 'app/bootstrap.js' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.");

				var tnsDir = path.join(projectDir, "tns_modules");
				assert.isTrue(fs.existsSync(tnsDir), "NativeScript Blank template does not contain mandatory 'tns_modules' directory. This directory is required in init command. You should check if this is problem with the template or change init command to use another file.");
			});

			it("TypeScript.Blank template has mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "TypeScript.Blank";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				var projectDir = project.getProjectDir().wait();
				var bootstrapJsFile = path.join(projectDir, "app", "bootstrap.js");
				assert.isTrue(fs.existsSync(bootstrapJsFile), "NativeScript TypeScript Blank template does not contain mandatory 'app/bootstrap.js' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.");

				var tnsDir = path.join(projectDir, "tns_modules");
				assert.isTrue(fs.existsSync(tnsDir), "NativeScript TypeScript.Blank template does not contain mandatory 'tns_modules' directory. This directory is required in init command. You should check if this is problem with the template or change init command to use another file.");
			});
		});

		describe("Cordova project", () => {
			it("Blank template has all mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "Blank";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				var projectDir = project.getProjectDir().wait();

				var cordovaMandatoryFiles = _.forEach(Object.keys(MobileHelper.platformCapabilities), platform => {
					var cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova Blank template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("TypeScript.Blank template has mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "TypeScript.Blank";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				var projectDir = project.getProjectDir().wait();

				var cordovaMandatoryFiles = _.forEach(Object.keys(MobileHelper.platformCapabilities), platform => {
					var cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova TypeScript.Blank template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("Friends template has mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "Friends";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				var projectDir = project.getProjectDir().wait();

				var cordovaMandatoryFiles = _.forEach(Object.keys(MobileHelper.platformCapabilities), platform => {
					var cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova Friends template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("KendoUI.Drawer template has mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "KendoUI.Drawer";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				var projectDir = project.getProjectDir().wait();

				var cordovaMandatoryFiles = _.forEach(Object.keys(MobileHelper.platformCapabilities), platform => {
					var cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova KendoUI.Drawer template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("KendoUI.Empty template has mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "KendoUI.Empty";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				var projectDir = project.getProjectDir().wait();

				var cordovaMandatoryFiles = _.forEach(Object.keys(MobileHelper.platformCapabilities), platform => {
					var cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova KendoUI.Empty template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("KendoUI.TabStrip template has mandatory files", () => {
				var options: any = require("./../lib/options");
				var tempFolder = temp.mkdirSync("template");
				var projectName = "Test";

				options.path = tempFolder;
				options.template = "KendoUI.TabStrip";
				options.appid = "com.telerik.Test";

				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				var projectDir = project.getProjectDir().wait();

				var cordovaMandatoryFiles = _.forEach(Object.keys(MobileHelper.platformCapabilities), platform => {
					var cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova KendoUI.TabStrip template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});
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
	var project: Project.IProject, projectProperties: IProjectPropertiesService, testInjector: IInjector, propSchemaCordova: any;
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

		projectProperties = testInjector.resolve("projectPropertiesService");

		propSchemaCordova = {
			"DisplayName": {
				"description": "The display name of the app."
			},
			"DeviceOrientations": {
				"description": "List of supported device orientations",
				"range": ["Portrait", "Landscape"],
				"flags": true
			},
			"ProjectName": {
				"description": "The project name identifies this project to the cloud build.",
				"validator": "projectNameValidator"
			},
			"BundleVersion": {
				"description": "The application (or bundle) version.",
				"regex": "^(\\d+)(\\.\\d+)?(\\.\\d+)?(\\.\\d+)?$",
				"validationMessage": "The version must consist of two, three or four numbers separated with dots."
			},
			"iOSStatusBarStyle": {
				"description": "iOS status bar style",
				"range": ["Default","BlackTranslucent","BlackOpaque","Hidden"]
			},
			"iOSDeviceFamily": {
				"description": "List of supported iOS device families",
				"range": {
					"1": {
						"input": "iPhone",
						"description": "iPhone/iPod Touch device family"
					},
					"2": {
						"input": "iPad",
						"description": "iPad device family"
					}
				},
				"flags": true
			}
		}
	});

	describe("updateProjectProperty", () => {
		it("sets unconstrained string property", () => {
			var projectData = {DisplayName: "wrong", Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "set", "DisplayName", ["fine"], propSchemaCordova).wait();
			assert.equal("fine", projectData.DisplayName);
		});

		it("sets string property with custom validator", () => {
			var projectData = {ProjectName: "wrong", Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "set", "ProjectName", ["fine"], propSchemaCordova).wait();
			assert.equal("fine", projectData.ProjectName);
			assert.ok(mockProjectNameValidator.validateCalled);
		});

		it("disallows 'add' on non-flag property", () => {
			var projectData = {ProjectName: "wrong", Framework: "Cordova"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "ProjectName", ["fine"], propSchemaCordova).wait());
		});

		it("disallows 'del' on non-flag property", () => {
			var projectData = {ProjectName: "wrong", Framework: "Cordova"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "del", "ProjectName", ["fine"], propSchemaCordova).wait());
		});

		it("sets bundle version when given proper input", () => {
			var projectData = {"BundleVersion": "0", Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30"], propSchemaCordova).wait();
			assert.equal("10.20.30", projectData.BundleVersion);
		});

		it("throws on invalid bundle version string", () => {
			var projectData = {"BundleVersion": "0", Framework: "Cordova"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30c"], propSchemaCordova).wait());
		});

		it("sets enumerated property", () => {
			var projectData = {iOSStatusBarStyle: "Default", Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["Hidden"], propSchemaCordova).wait();
			assert.equal("Hidden", projectData.iOSStatusBarStyle);
		});

		it("disallows unrecognized values for enumerated property", () => {
			var projectData = {iOSStatusBarStyle: "Default", Framework: "Cordova"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["does not exist"], propSchemaCordova).wait());
		});

		it("appends to verbatim enumerated collection property", () => {
			var projectData: any = {DeviceOrientations: [], Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Portrait"], propSchemaCordova).wait();
			assert.deepEqual(["Portrait"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape", "Portrait"], projectData.DeviceOrientations);
		});

		it("appends to enumerated collection property with shorthand", () => {
			var projectData: any = {iOSDeviceFamily: [], Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPhone"], propSchemaCordova).wait();
			assert.deepEqual(["1"], projectData.iOSDeviceFamily);
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPad"], propSchemaCordova).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("appends multiple values to enumerated collection property", () => {
			var projectData: any = {iOSDeviceFamily: [], Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["iPhone", "iPad"], propSchemaCordova).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("removes from enumerated collection property", () => {
			var projectData: any = {DeviceOrientations: ["Landscape", "Portrait"], Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("disallows unrecognized values for enumerated collection property", () => {
			var projectData: any = {DeviceOrientations: [], Framework: "Cordova"};
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape", "bar"], propSchemaCordova).wait());
		});

		it("makes case-insensitive comparisons of property name", () => {
			var projectData: any = {DeviceOrientations: [], Framework: "Cordova"};
			projectProperties.updateProjectProperty(projectData, "add", "deviceorientations", ["Landscape"], propSchemaCordova).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("makes case-insensitive comparisons of property values", () => {
			var projectData: any = {DeviceOrientations: [], Framework: "Cordova"};
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

		project = testInjector.resolve("project");

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

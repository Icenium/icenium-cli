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
import frameworkProjectResolverLib = require("../lib/project/framework-project-resolver");
import projectFilesManagerLib = require("../lib/project/project-files-manager");
import projectConstantsLib = require("../lib/project/project-constants");
import jsonSchemaLoaderLib = require("../lib/json-schema/json-schema-loader");
import jsonSchemaResolverLib = require("../lib/json-schema/json-schema-resolver");
import jsonSchemaValidatorLib = require("../lib/json-schema/json-schema-validator");
import jsonSchemaConstantsLib = require("../lib/json-schema/json-schema-constants");
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
	testInjector.register("prompter", {});
	testInjector.register("jsonSchemaLoader", jsonSchemaLoaderLib.JsonSchemaLoader);
	testInjector.register("jsonSchemaResolver", jsonSchemaResolverLib.JsonSchemaResolver);
	testInjector.register("jsonSchemaValidator", jsonSchemaValidatorLib.JsonSchemaValidator),
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
	testInjector.register("jsonSchemaConstants", jsonSchemaConstantsLib.JsonSchemaConstants);

	return testInjector;
}

describe("project integration tests", () => {
	var project: Project.IProject, testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);
		project = testInjector.resolve(projectlib.Project);
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
			var guidRegex = new RegExp(projectSchema.ProjectGuid.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;

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

function getProjectData(): IProjectData {
	return {
		"ProjectName": "testDisplayName",
		"ProjectGuid": "{9916af8d-64cf-4d4b-9ddd-850931624535}",
		"projectVersion": 1,
		"AppIdentifier": "com.telerik.hybrid4",
		"DisplayName": "testDisplayName",
		"Author": "",
		"Description": "",
		"BundleVersion": "1.0",
		"AndroidVersionCode": "1",
		"iOSDeviceFamily": ["1", "2"],
		"iOSBackgroundMode": [],
		"ProjectTypeGuids": "{F0A65104-D4F4-4012-B799-F612D75820F6}",
		"FrameworkVersion": "0.4.0",
		"AndroidPermissions": [],
		"DeviceOrientations": ["Portrait", "Landscape"],
		"AndroidHardwareAcceleration": "false",
		"iOSStatusBarStyle": "Default",
		"Framework": "NativeScript",
		"WP8TileTitle": "",
		"WP8Publisher": "",
		"WP8Capabilities": [],
		"WP8Requirements": [],
		"WP8PublisherID": "{3a53c214-8238-4981-a113-9af9b17b16ff}",
		"WP8ProductID": "{b5171802-b3d5-4d6c-af25-fe18f4f9c6d1}",
		"WP8SupportedResolutions": [
			"ID_RESOLUTION_WVGA",
			"ID_RESOLUTION_WXGA",
			"ID_RESOLUTION_HD720P"
		],
		"CorePlugins": [ ],
		"CordovaPluginVariables": {}
	};
}

describe("project unit tests", () => {
	var projectProperties: IProjectPropertiesService, testInjector: IInjector;

	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);

		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		var config = testInjector.resolve("config");
		var staticConfig = testInjector.resolve("staticConfig");
		staticConfig.PROJECT_FILE_NAME = "";
		config.AUTO_UPGRADE_PROJECT_FILE = false;

		projectProperties = testInjector.resolve(projectPropertiesLib.ProjectPropertiesService);
	});

	describe("updateProjectProperty", () => {
		it("sets unconstrained string property", () => {
			var projectData = getProjectData();
			projectData.DisplayName = "wrong";
			projectProperties.updateProjectProperty(projectData, "set", "DisplayName", ["fine"]).wait();
			assert.equal("fine", projectData.DisplayName);
		});

		it("sets string property with custom validator", () => {
			var projectData = getProjectData();
			projectData.ProjectName = "wrong";
			projectProperties.updateProjectProperty(projectData, "set", "ProjectName", ["fine"]).wait();
			assert.equal("fine", projectData.ProjectName);
		});

		it("disallows 'add' on non-flag property", () => {
			var projectData = getProjectData();
			projectData.ProjectName = "wrong";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "ProjectName", ["fine"]).wait());
		});

		it("disallows 'del' on non-flag property", () => {
			var projectData = getProjectData();
			projectData.ProjectName = "wrong";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "del", "ProjectName", ["fine"]).wait());
		});

		it("sets bundle version when given proper input", () => {
			var projectData = getProjectData();
			projectData.BundleVersion = "0";
			projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30"]).wait();
			assert.equal("10.20.30", projectData.BundleVersion);
		});

		it("throws on invalid bundle version string", () => {
			var projectData = getProjectData();
			projectData.BundleVersion = "0";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30c"]).wait());
		});

		it("sets enumerated property", () => {
			var projectData = getProjectData();
			projectData.iOSStatusBarStyle = "Default";
			projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["Hidden"]).wait();
			assert.equal("Hidden", projectData.iOSStatusBarStyle);
		});

		it("disallows unrecognized values for enumerated property", () => {
			var projectData = getProjectData();
			projectData.iOSStatusBarStyle = "Default";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["does not exist"]).wait());
		});

		it("appends to verbatim enumerated collection property", () => {
			var projectData = getProjectData();
			projectData.DeviceOrientations = [];
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Portrait"]).wait();
			assert.deepEqual(["Portrait"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape"]).wait();
			assert.deepEqual(["Portrait", "Landscape"], projectData.DeviceOrientations);
		});

		it("appends to enumerated collection property with shorthand", () => {
			var projectData = getProjectData();
			projectData.iOSDeviceFamily = [];
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["1"]).wait();
			assert.deepEqual(["1"], projectData.iOSDeviceFamily);
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["2"]).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("appends multiple values to enumerated collection property", () => {
			var projectData = getProjectData();
			projectData.iOSDeviceFamily = [];
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["1", "2"]).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("removes from enumerated collection property", () => {
			var projectData = getProjectData();
			projectData.DeviceOrientations = ["Landscape", "Portrait"];
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("disallows unrecognized values for enumerated collection property", () => {
			var projectData = getProjectData();
			projectData.DeviceOrientations = [];
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape", "bar"]).wait());
		});

		it("makes case-insensitive comparisons of property name", () => {
			var projectData = getProjectData();
			projectData.DeviceOrientations = [];
			projectProperties.updateProjectProperty(projectData, "add", "deviceorientations", ["Landscape"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("makes case-insensitive comparisons of property values", () => {
			var projectData = getProjectData();
			projectData.DeviceOrientations = [];
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});
	});
});

describe("project unit tests (canonical paths)", () => {
	var project: any, testInjector: IInjector, oldPath: string;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.resolve("staticConfig").PROJECT_FILE_NAME = "";
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);

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


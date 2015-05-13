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
import mobileHelperLib = require("../lib/common/mobile/mobile-helper");
import devicePlatformsLib = require("../lib/common/mobile/device-platforms-constants");
import options = require("./../lib/common/options");
import helpers = require("../lib/helpers");
import cordovaProjectLib = require("./../lib/project/cordova-project");
import nativeScriptProjectLib = require("./../lib/project/nativescript-project");
import frameworkProjectResolverLib = require("../lib/project/resolvers/framework-project-resolver");
import projectFilesManagerLib = require("../lib/project/project-files-manager");
import projectConstantsLib = require("../lib/project/project-constants");
import jsonSchemaLoaderLib = require("../lib/json-schema/json-schema-loader");
import jsonSchemaResolverLib = require("../lib/json-schema/json-schema-resolver");
import jsonSchemaValidatorLib = require("../lib/json-schema/json-schema-validator");
import jsonSchemaConstantsLib = require("../lib/json-schema/json-schema-constants");
import childProcessLib = require("../lib/common/child-process");
import mobilePlatformsCapabilitiesLib = require("../lib/mobile-platforms-capabilities");
import projectPropertiesService = require("../lib/services/project-properties-service");
import cordovaMigrationService = require("../lib/services/cordova-migration-service");
import Future = require("fibers/future");
let projectConstants = new projectConstantsLib.ProjectConstants();
let assert = require("chai").assert;
temp.track();


class PrompterStub implements IPrompter {
	public confirmResult: boolean = false;
	public confirmCalled: boolean = false;

	get(schema: IPromptSchema[]): IFuture<any> { return Future.fromResult("");}
	getPassword(prompt: string, options?: {allowEmpty?: boolean}): IFuture<string> { return Future.fromResult("");}
	getString(prompt: string): IFuture<string>{ return Future.fromResult("");}
	promptForChoice(promptMessage: string, choices: any[]): IFuture<string>{ return Future.fromResult("");}
	confirm(prompt: string, defaultAction?: () => boolean): IFuture<boolean> {
		this.confirmCalled = true;
		return Future.fromResult(this.confirmResult);
	}
	public dispose() { }
}

let mockProjectNameValidator = {
	validateCalled: false,
	validate: () => {
		mockProjectNameValidator.validateCalled = true;
		return true;
	}
};

function createFrameworkVersion(version: string) {
	return { Version: version, DisplayName: version };
}

function createTestInjector(): IInjector {
	require("../lib/common/logger");

	let testInjector = new yok.Yok();
	testInjector.register("project", projectlib.Project);

	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("opener", stubs.OpenerStub);
	testInjector.register("config", require("../lib/config").Configuration);
	testInjector.register("staticConfig", require("../lib/config").StaticConfig);
	testInjector.register("server", {
		cordova: {
			getCordovaFrameworkVersions: () => {
				return Future.fromResult([{ DisplayName: "version_3_2_0", Version: { _Major: 3, _Minor: 2, _Build: 0, _Revision: -1 } },
				{ DisplayName: "version_3_5_0", Version: { _Major: 3, _Minor: 5, _Build: 0, _Revision: -1 } },
				{ DisplayName: "version_3_7_0", Version: { _Major: 3, _Minor: 7, _Build: 0, _Revision: -1 } }]);
			}
		}

	});
	testInjector.register("identityManager", {});
	testInjector.register("buildService", {});
	testInjector.register("projectNameValidator", mockProjectNameValidator);
	testInjector.register("loginManager", stubs.LoginManager);
	testInjector.register("templatesService", stubs.TemplateServiceStub);
	testInjector.register("userDataStore", {});
	testInjector.register("qr", {});
	testInjector.register("cordovaMigrationService", cordovaMigrationService.CordovaMigrationService);
	testInjector.register("resources", $injector.resolve("resources"));
	testInjector.register("pathFilteringService", stubs.PathFilteringServiceStub);
	testInjector.register("prompter", PrompterStub);
	testInjector.register("jsonSchemaLoader", jsonSchemaLoaderLib.JsonSchemaLoader);
	testInjector.register("jsonSchemaResolver", jsonSchemaResolverLib.JsonSchemaResolver);
	testInjector.register("jsonSchemaValidator", jsonSchemaValidatorLib.JsonSchemaValidator);
	testInjector.register("childProcess", childProcessLib.ChildProcess);
	testInjector.register("injector", testInjector);
	testInjector.register("mobileHelper", mobileHelperLib.MobileHelper);
	testInjector.register("devicePlatformsConstants", devicePlatformsLib.DevicePlatformsConstants);
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
	testInjector.register("loginManager", { ensureLoggedIn: (): IFuture<void> => { return (() => { }).future<void>()() } });
	testInjector.register("mobilePlatformsCapabilities", mobilePlatformsCapabilitiesLib.MobilePlatformsCapabilities);
	testInjector.register("httpClient", {});
	testInjector.register("multipartUploadService", {});
	testInjector.register("progressIndicator", {});


	testInjector.register("pluginsService", {
		getPluginBasicInformation: (pluginName: string) => { 
			return {
				name: 'Name',
				version: '1.0.0'
			}
		},
		getPluginVersions: (pluginName: string) => {
			return [{
				name: '1.0.0',
				value: '1.0.0',
				minCordova: '3.0.0'
			}]
		}
	});
	testInjector.register("projectPropertiesService", projectPropertiesService.ProjectPropertiesService);

	return testInjector;
}

describe("project integration tests", () => {
	let project: Project.IProject, testInjector: IInjector;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);

	});

	describe("createNewProject", () => {
		it("creates a valid project folder (Cordova project)", () => {
			project = testInjector.resolve(projectlib.Project);
			let options: any = require("./../lib/common/options");
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";

			project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();

			let abProject = fs.readFileSync(path.join(tempFolder, ".abproject"));
			let correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-Cordova.abproject"));
			let testProperties = JSON.parse(abProject.toString());
			let correctProperties = JSON.parse(correctABProject.toString());

			let projectSchema = project.getProjectSchema().wait();
			let guidRegex = new RegExp(projectSchema.WP8ProductID.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;
			assert.ok(guidRegex.test(testProperties.WP8ProductID));
			delete testProperties.WP8ProductID;
			assert.ok(guidRegex.test(testProperties.WP8PublisherID));
			delete testProperties.WP8PublisherID;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for(let key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});

		it("creates a valid project folder (NativeScript project)", () => {
			project = testInjector.resolve(projectlib.Project);
			let options: any = require("./../lib/common/options");
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";

			project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
			let abProject = fs.readFileSync(path.join(tempFolder, ".abproject"));
			let correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-NativeScript.abproject"));
			let testProperties = JSON.parse(abProject.toString());
			let correctProperties = JSON.parse(correctABProject.toString());

			let projectSchema = project.getProjectSchema().wait();
			let guidRegex = new RegExp(projectSchema.ProjectGuid.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for(let key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});

		it("with long name should throw ", () => {
			project = testInjector.resolve(projectlib.Project);
			let projectName = "Thirtyone character long string";

			assert.throws(() => project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait());
		});
	});

	describe("updateProjectPropertiesAndSave",() => {
		let prompter: PrompterStub;
		beforeEach(() => {
			prompter = testInjector.resolve("prompter");
			prompter.confirmResult = true;
			let options: any = require("../lib/common/options");
			let tempFolder = temp.mkdirSync("template");

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";
			let projectName = "Test";
			project = testInjector.resolve("project");
			project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
		});

		it("updates WPSdk to 8.0 when Cordova is downgraded from 3.7.0",() => {
			project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]).wait();
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk must be 8.1");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must be 3.7.0");

			project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]).wait();
			
			assert.strictEqual(project.projectData.WPSdk, "8.0", "WPSdk must be downgraded to 8.0 when downgrading Cordova version from 3.7.0");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.5.0", "Cordova version should have been migrated to 3.7.0");
		});

		it("updates FrameworkVersion to 3.7.0 when WPSdk is updated to 8.1",() => {
			project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]).wait();
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must be updated to 3.7.0 when WPSdk is updated to 8.1");
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk should have been updated to 8.1");
		});

		it("does not update FrameworkVersion to 3.7.0 when trying to update WPSdk to 8.1 but user refuses",() => {
			prompter.confirmResult = false;
			project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]).wait();
			assert.throws(() => project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]).wait());
			assert.strictEqual(project.projectData.FrameworkVersion, "3.5.0", "Cordova version must stay to 3.5.0 when user refuses to upgrade WPSdk to 8.1");
			assert.strictEqual(project.projectData.WPSdk, "8.0", "WPSdk version must be 8.0 when user refuses to upgrade it to 8.1");
		});

		it("does not update WPSdk to 8.0 when trying to update FrameworkVersion to 3.5.0 but user refuses",() => {
			// First set WPSdk to 8.1 and FrameworkVersion to 3.7.0
			prompter.confirmResult = true;
			project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]).wait();
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must be 3.7.0.");

			prompter.confirmResult = false;
			assert.throws(() => project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]).wait());
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must stay to 3.7.0 when user refuses to downgrade WPSdk to 8.0");
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk version must be 8.1 when user refuses to downgrade it to 8.1");
		});

		it("does not prompt for WPSdk downgrade to 8.0 when Cordova is downgraded from 3.7.0 and WPSdk is already 8.0",() => {
			project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.7.0"]).wait();
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version should have been migrated to 3.7.0");
			prompter.confirmCalled = false;
			project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]).wait();
			assert.isFalse(prompter.confirmCalled, "We have prompted for confirmation to change WPSdk to 8.0, but it is already 8.0. DO NOT PROMPT HERE!");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.5.0", "Cordova version should have been migrated to 3.5.0");
		});

		it("does not prompt for Cordova upgrade to 3.7.0 when WPSdk is upgraded to 8.1 and FrameworkVersion is already 3.7.0",() => {
			project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.7.0"]).wait();
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version should have been migrated to 3.7.0");
			
			project.updateProjectPropertyAndSave("set", "WPSdk", ["8.0"]).wait();
			assert.strictEqual(project.projectData.WPSdk, "8.0", "WPSdk version should have been migrated to 8.0");
			prompter.confirmCalled = false;
			project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]).wait();
			assert.isFalse(prompter.confirmCalled, "We have prompted for confirmation to change Cordova version to 3.7.0, but it is already 3.7.0. DO NOT PROMPT HERE!");
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk version should have been migrated to 8.0");
		});
	});

	describe("Init command tests",() => {
		let options: any;
		let tempFolder: string;
		let projectName = "Test";
		let mobileHelper: Mobile.IMobileHelper;
		beforeEach(() => {
			options = require("../lib/common/options");
			tempFolder = temp.mkdirSync("template");
			options.path = tempFolder;
			options.appid = "com.telerik.Test";
			mobileHelper = testInjector.resolve("mobileHelper");
		});

		describe("NativeScript project", () => {
			it("Blank template has all mandatory files", () => {
				options.template = "Blank";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				let projectDir = project.getProjectDir().wait();
				let tnsDir = path.join(projectDir, "app", "tns_modules");
				assert.isTrue(fs.existsSync(tnsDir), "NativeScript Blank template does not contain mandatory 'tns_modules' directory. This directory is required in init command. You should check if this is problem with the template or change init command to use another file.");
			});

			it("TypeScript.Blank template has mandatory files", () => {
				options.template = "TypeScript.Blank";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				let projectDir = project.getProjectDir().wait();
				let tnsDir = path.join(projectDir, "app", "tns_modules");
				assert.isTrue(fs.existsSync(tnsDir), "NativeScript TypeScript.Blank template does not contain mandatory 'tns_modules' directory. This directory is required in init command. You should check if this is problem with the template or change init command to use another file.");
			});

			it("existing TypeScript.Blank project has project files after init",() => {
				options.template = "TypeScript.Blank";
				let project: Project.IProject = testInjector.resolve("project");
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				let projectDir = project.getProjectDir().wait();
				let projectFile = path.join(projectDir, ".abproject");
				let abignoreFile = path.join(projectDir, ".abignore");
				fs.unlinkSync(projectFile);
				fs.unlinkSync(abignoreFile);
				options.path = projectDir;
				project.initializeProjectFromExistingFiles(projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				assert.isTrue(fs.existsSync(projectFile), "After initialization, project does not have .abproject file.");
				assert.isTrue(fs.existsSync(abignoreFile), "After initialization, project does not have .abignore file.");
			});

			it("existing project has .abproject and .abignore files after init",() => {
				options.template = "Blank";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				let projectDir = project.getProjectDir().wait();
				let projectFile = path.join(projectDir, ".abproject");
				let abignoreFile = path.join(projectDir, ".abignore");
				fs.unlinkSync(projectFile);
				fs.unlinkSync(abignoreFile);
				options.path = projectDir;
				project.initializeProjectFromExistingFiles(projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
				assert.isTrue(fs.existsSync(projectFile), "After initialization, project does not have .abproject file.");
				assert.isTrue(fs.existsSync(abignoreFile), "After initialization, project does not have .abignore file.");
			});
		});

		describe("Cordova project",() => {
			it("existing project has configuration specific files and .abignore files after init",() => {
				options.template = "Blank";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				let projectDir = project.getProjectDir().wait();
				let projectFile = path.join(projectDir, projectConstants.PROJECT_FILE);
				let releaseProjectFile = path.join(projectDir, projectConstants.RELEASE_PROJECT_FILE_NAME);
				let debugProjectFile = path.join(projectDir, projectConstants.DEBUG_PROJECT_FILE_NAME);
				let abignoreFile = path.join(projectDir, ".abignore");
				fs.unlinkSync(projectFile);
				fs.unlinkSync(releaseProjectFile);
				fs.unlinkSync(debugProjectFile);
				fs.unlinkSync(abignoreFile);
				options.path = projectDir;
				project.initializeProjectFromExistingFiles(projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				assert.isTrue(fs.existsSync(projectFile), "After initialization, project does not have .abproject file.");
				assert.isTrue(fs.existsSync(abignoreFile), "After initialization, project does not have .abignore file.");
				assert.isTrue(fs.existsSync(debugProjectFile), "After initialization, project does not have .debug.abproject file.");
				assert.isTrue(fs.existsSync(releaseProjectFile), "After initialization, project does not have .release.abproject file.");
			});

			it("Blank template has all mandatory files", () => {
				options.template = "Blank";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				let projectDir = project.getProjectDir().wait();

				let cordovaMandatoryFiles = _.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova Blank template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("TypeScript.Blank template has mandatory files", () => {
				options.template = "TypeScript.Blank";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				let projectDir = project.getProjectDir().wait();

				let cordovaMandatoryFiles = _.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova TypeScript.Blank template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("KendoUI.Drawer template has mandatory files", () => {
				options.template = "KendoUI.Drawer";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				let projectDir = project.getProjectDir().wait();

				let cordovaMandatoryFiles = _.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova KendoUI.Drawer template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("KendoUI.Empty template has mandatory files", () => {
				options.template = "KendoUI.Empty";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				let projectDir = project.getProjectDir().wait();

				let cordovaMandatoryFiles = _.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova KendoUI.Empty template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});

			it("KendoUI.TabStrip template has mandatory files", () => {
				options.template = "KendoUI.TabStrip";
				project.createNewProject(projectName, projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
				let projectDir = project.getProjectDir().wait();

				let cordovaMandatoryFiles = _.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), util.format("Cordova KendoUI.TabStrip template does not contain mandatory '%s' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.", cordovaFile));
				});
			});
		});
	});

	describe("createTemplateFolder", () => {
		it("creates project folder when folder with that name doesn't exists", () => {
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";
			let projectFolder = path.join(tempFolder, projectName);

			project.createTemplateFolder(projectFolder).wait();
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("doesn't fail when folder with that name exists and it's empty", () => {
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";
			let projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			project.createTemplateFolder(projectFolder).wait();
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("fails when project folder is not empty", () => {
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";
			let projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			fs.closeSync(fs.openSync(path.join(projectFolder, "temp"), "a", "0666"));
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
		"ProjectTypeGuids": "{070BCB52-5A75-4F8C-A973-144AF0EAFCC9}",
		"FrameworkVersion": "3.5.0",
		"AndroidPermissions": [],
		"DeviceOrientations": ["Portrait", "Landscape"],
		"AndroidHardwareAcceleration": "false",
		"iOSStatusBarStyle": "Default",
		"Framework": "Cordova",
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
		"CordovaPluginVariables": {},
		"WPSdk": "8.0"
	};
}

describe("project unit tests", () => {
	let projectProperties: IProjectPropertiesService, testInjector: IInjector;

	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);

		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		let config = testInjector.resolve("config");
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.PROJECT_FILE_NAME = "";
		config.AUTO_UPGRADE_PROJECT_FILE = false;
		projectProperties = testInjector.resolve(projectPropertiesLib.ProjectPropertiesService);
	});

	describe("updateProjectProperty", () => {
		it("sets unconstrained string property", () => {
			let projectData = getProjectData();
			projectData.DisplayName = "wrong";
			projectProperties.updateProjectProperty(projectData, "set", "DisplayName", ["fine"]).wait();
			assert.equal("fine", projectData.DisplayName);
		});

		it("sets string property with custom validator", () => {
			let projectData = getProjectData();
			projectData.ProjectName = "wrong";
			projectProperties.updateProjectProperty(projectData, "set", "ProjectName", ["fine"]).wait();
			assert.equal("fine", projectData.ProjectName);
		});

		it("disallows 'add' on non-flag property", () => {
			let projectData = getProjectData();
			projectData.ProjectName = "wrong";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "ProjectName", ["fine"]).wait());
		});

		it("disallows 'del' on non-flag property", () => {
			let projectData = getProjectData();
			projectData.ProjectName = "wrong";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "del", "ProjectName", ["fine"]).wait());
		});

		it("sets bundle version when given proper input", () => {
			let projectData = getProjectData();
			projectData.BundleVersion = "0";
			projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30"]).wait();
			assert.equal("10.20.30", projectData.BundleVersion);
		});

		it("throws on invalid bundle version string", () => {
			let projectData = getProjectData();
			projectData.BundleVersion = "0";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "BundleVersion", ["10.20.30c"]).wait());
		});

		it("sets enumerated property", () => {
			let projectData = getProjectData();
			projectData.iOSStatusBarStyle = "Default";
			projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["Hidden"]).wait();
			assert.equal("Hidden", projectData.iOSStatusBarStyle);
		});

		it("disallows unrecognized values for enumerated property", () => {
			let projectData = getProjectData();
			projectData.iOSStatusBarStyle = "Default";
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "set", "iOSStatusBarStyle", ["does not exist"]).wait());
		});

		it("appends to verbatim enumerated collection property", () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Portrait"]).wait();
			assert.deepEqual(["Portrait"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape"]).wait();
			assert.deepEqual(["Portrait", "Landscape"], projectData.DeviceOrientations);
		});

		it("appends to enumerated collection property with shorthand", () => {
			let projectData = getProjectData();
			projectData.iOSDeviceFamily = [];
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["1"]).wait();
			assert.deepEqual(["1"], projectData.iOSDeviceFamily);
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["2"]).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("appends multiple values to enumerated collection property", () => {
			let projectData = getProjectData();
			projectData.iOSDeviceFamily = [];
			projectProperties.updateProjectProperty(projectData, "add", "iOSDeviceFamily", ["1", "2"]).wait();
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("removes from enumerated collection property", () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = ["Landscape", "Portrait"];
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
			projectProperties.updateProjectProperty(projectData, "del", "DeviceOrientations", ["Portrait"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("disallows unrecognized values for enumerated collection property", () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			assert.throws(() => projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape", "bar"]).wait());
		});

		it("makes case-insensitive comparisons of property name", () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			projectProperties.updateProjectProperty(projectData, "add", "deviceorientations", ["Landscape"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("makes case-insensitive comparisons of property values", () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			projectProperties.updateProjectProperty(projectData, "add", "DeviceOrientations", ["Landscape"]).wait();
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});
	});
});

describe("project unit tests (canonical paths)", () => {
	let project: any, testInjector: IInjector, oldPath: string;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		testInjector.register("fs", stubs.FileSystemStub);
		testInjector.resolve("staticConfig").PROJECT_FILE_NAME = "";
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.triggerJsonSchemaValidation = false;
		project = testInjector.resolve("project");

		oldPath = options.path;
	});
	after(() => {
		options.path = oldPath;
	});

	it("no ending path separator", () => {
		options.path = "test";
		let project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test"));
	});

	it("one ending path separator", () => {
		options.path = "test" + path.sep;
		let project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test"));
	});

	it("multiple ending path separator", () => {
		options.path = "test" + path.sep + path.sep;
		let project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test"));
	});

	it("do not remove separators which are not at the end", () => {
		options.path = "test" + path.sep + "test" + path.sep;
		let project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir().wait(), path.join(process.cwd(), "test" + path.sep + "test"));
	});
});

describe("cordovaProject unit tests",() => {
	let projectProperties: IProjectPropertiesService, testInjector: IInjector;

	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);

		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		let config = testInjector.resolve("config");
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.PROJECT_FILE_NAME = "";
		config.AUTO_UPGRADE_PROJECT_FILE = false;

		projectProperties = testInjector.resolve(projectPropertiesLib.ProjectPropertiesService);
	});

	describe("alterPropertiesForNewProject",() => {
		it("sets correct WP8PackageIdentityName when appid is short",() => {
			let cordovaProject: Project.IFrameworkProject = testInjector.resolve("cordovaProject");
			let props: any = {};
			options.appid = "appId";
			cordovaProject.alterPropertiesForNewProject(props, "name");
			assert.equal(props["WP8PackageIdentityName"], "1234Telerik.appId");
		});

		it("sets correct WP8PackageIdentityName when appid combined with default prefix has 50 symbols length",() => {
			let cordovaProject: Project.IFrameworkProject = testInjector.resolve("cordovaProject");
			let props: any = {};
			let defaultPrefix = "1234Telerik.";
			let value = _.range(0, 50 - defaultPrefix.length).map(num => "a").join("");
			options.appid = value;

			cordovaProject.alterPropertiesForNewProject(props, "name");
			assert.equal(props["WP8PackageIdentityName"], defaultPrefix + value);
		});

		it("sets correct WP8PackageIdentityName when appid combined with default prefix has more than 50 symbols length",() => {
			let cordovaProject: Project.IFrameworkProject = testInjector.resolve("cordovaProject");
			let props: any = {};
			let defaultPrefix = "1234Telerik.";
			let value = _.range(0, 50 - defaultPrefix.length).map(num => "a").join("");
			options.appid = value + "another long value that should be omitted at the end";

			cordovaProject.alterPropertiesForNewProject(props, "name");
			assert.equal(props["WP8PackageIdentityName"], defaultPrefix + value);
		});
	});
});

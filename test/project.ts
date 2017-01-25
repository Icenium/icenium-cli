import * as projectlib from "../lib/project";
import * as fslib from "../lib/common/file-system";
import * as projectPropertiesLib from "../lib/services/project-properties-service";
import * as yok from "../lib/common/yok";
import * as stubs from "./stubs";
import * as fs from "fs";
import * as path from "path";
import temp = require("temp");
import * as util from "util";
import * as mobileHelperLib from "../lib/common/mobile/mobile-helper";
import * as devicePlatformsLib from "../lib/common/mobile/device-platforms-constants";
import * as optionsLib from "../lib/options";
import * as cordovaProjectLib from "./../lib/project/cordova-project";
import * as nativeScriptProjectLib from "./../lib/project/nativescript-project";
import * as projectFilesManagerLib from "../lib/common/services/project-files-manager";
import * as projectConstantsLib from "../lib/common/appbuilder/project-constants";
import * as jsonSchemaLoaderLib from "../lib/json-schema/json-schema-loader";
import * as jsonSchemaResolverLib from "../lib/json-schema/json-schema-resolver";
import * as jsonSchemaValidatorLib from "../lib/json-schema/json-schema-validator";
import * as jsonSchemaConstantsLib from "../lib/json-schema/json-schema-constants";
import * as childProcessLib from "../lib/common/child-process";
import * as mobilePlatformsCapabilitiesLib from "../lib/common/appbuilder/mobile-platforms-capabilities";
import * as cordovaResourcesLib from "../lib/cordova-resource-loader";
import * as projectPropertiesService from "../lib/services/project-properties-service";
import * as cordovaMigrationService from "../lib/services/cordova-migration-service";
import * as hostInfoLib from "../lib/common/host-info";
import { DeviceAppDataProvider } from "../lib/common/appbuilder/providers/device-app-data-provider";
import { ProjectFilesProvider } from "../lib/common/appbuilder/providers/project-files-provider";
import { DeviceAppDataFactory } from "../lib/common/mobile/device-app-data/device-app-data-factory";
import { LocalToDevicePathDataFactory } from "../lib/common/mobile/local-to-device-path-data-factory";
import { ConfigFilesManager } from "../lib/project/config-files-manager";
import { assert } from "chai";
import { NativeScriptProjectCapabilities } from "../lib/common/appbuilder/project/nativescript-project-capabilities";
import { CordovaProjectCapabilities } from "../lib/common/appbuilder/project/cordova-project-capabilities";
temp.track();
let projectConstants = new projectConstantsLib.ProjectConstants();
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../lib/common/constants";
import { DateProvider } from "../lib/providers/date-provider";

class PrompterStub implements IPrompter {
	public confirmResult: boolean = false;
	public confirmCalled: boolean = false;

	async get(schema: IPromptSchema[]): Promise<any> { return Promise.resolve(""); }
	async getPassword(prompt: string, options?: { allowEmpty?: boolean }): Promise<string> { return Promise.resolve(""); }
	async getString(prompt: string): Promise<string> { return Promise.resolve(""); }
	async promptForChoice(promptMessage: string, choices: any[]): Promise<string> { return Promise.resolve(""); }
	async confirm(prompt: string, defaultAction?: () => boolean): Promise<boolean> {
		this.confirmCalled = true;
		return Promise.resolve(this.confirmResult);
	}
	public dispose() { /* intentionally empty body */ }
}

let mockProjectNameValidator = {
	validateCalled: false,
	validate: () => {
		mockProjectNameValidator.validateCalled = true;
		return true;
	}
};

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
				return Promise.resolve([{ DisplayName: "version_3_2_0", Version: { _Major: 3, _Minor: 2, _Build: 0, _Revision: -1 } },
				{ DisplayName: "version_3_5_0", Version: { _Major: 3, _Minor: 5, _Build: 0, _Revision: -1 } },
				{ DisplayName: "version_3_7_0", Version: { _Major: 3, _Minor: 7, _Build: 0, _Revision: -1 } }]);
			}
		}

	});
	testInjector.register("identityManager", {});
	testInjector.register("buildService", {});
	testInjector.register("ionicProjectTransformator", {});
	testInjector.register("projectNameValidator", mockProjectNameValidator);
	testInjector.register("loginManager", stubs.LoginManager);
	testInjector.register("templatesService", stubs.TemplateServiceStub);
	testInjector.register("userDataStore", {});
	testInjector.register("qr", {});
	testInjector.register("cordovaResources", cordovaResourcesLib.CordovaResourceLoader);
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
			if (!framework || framework === "Cordova") {
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
	testInjector.register("loginManager", { ensureLoggedIn: async (): Promise<void> => { /*intentionally empty body */ } });
	testInjector.register("mobilePlatformsCapabilities", mobilePlatformsCapabilitiesLib.MobilePlatformsCapabilities);
	testInjector.register("httpClient", {});
	testInjector.register("multipartUploadService", {});
	testInjector.register("progressIndicator", {});
	testInjector.register("nativeScriptProjectCapabilities", NativeScriptProjectCapabilities);
	testInjector.register("cordovaProjectCapabilities", CordovaProjectCapabilities);

	testInjector.register("pluginsService", {
		getPluginBasicInformation: (pluginName: string) => Promise.resolve({ name: 'Name', version: '1.0.0' }),
		getPluginVersions: (plugin: IPlugin) => {
			return [{
				name: '1.0.0',
				value: '1.0.0',
				minCordova: '3.0.0'
			}];
		},
		getAvailablePlugins: () => {
			return [
				{
					data: {
						Identifier: "Name",
						Version: '1.0.0'
					}
				}
			];
		}
	});
	testInjector.register("projectPropertiesService", projectPropertiesService.ProjectPropertiesService);
	testInjector.register("options", optionsLib.Options);
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("webViewService", {
		minSupportedVersion: "4.0.0",
		getCurrentWebViewName: () => "Default",
		getWebView: () => ({ name: "Default" }),
		enableWebView: () => Promise.resolve()
	});
	testInjector.register("serverConfiguration", {});

	testInjector.register("deviceAppDataFactory", DeviceAppDataFactory);
	testInjector.register("localToDevicePathDataFactory", LocalToDevicePathDataFactory);
	testInjector.register("deviceAppDataProvider", DeviceAppDataProvider);
	testInjector.register("projectFilesProvider", ProjectFilesProvider);
	testInjector.register("configFilesManager", ConfigFilesManager);
	testInjector.register("dateProvider", DateProvider);
	testInjector.register("typeScriptService", {
		isTypeScriptProject: async (projectDir: string): Promise<boolean> => false
	});
	testInjector.register("npmService", {});

	return testInjector;
}

describe("project integration tests", () => {
	let project: Project.IProject, testInjector: IInjector, options: IOptions;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);
		testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);
		options = testInjector.resolve("options");
		testInjector.resolve("nativeScriptProject").updateMigrationConfigFile = async () => undefined;
	});

	describe("createNewProject", () => {
		it("creates a valid project folder (Cordova project)", async () => {
			project = testInjector.resolve(projectlib.Project);
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";

			await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);

			let abProject = fs.readFileSync(path.join(tempFolder, ".abproject"));
			let correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-Cordova.abproject"));
			let testProperties = JSON.parse(abProject.toString());
			let correctProperties = JSON.parse(correctABProject.toString());

			let projectSchema = await project.getProjectSchema();
			let guidRegex = new RegExp(projectSchema.WP8ProductID.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;
			assert.ok(guidRegex.test(testProperties.WP8ProductID));
			delete testProperties.WP8ProductID;
			assert.ok(guidRegex.test(testProperties.WP8PublisherID));
			delete testProperties.WP8PublisherID;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for (let key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});

		it("creates a valid project folder (NativeScript project)", async () => {
			project = testInjector.resolve(projectlib.Project);
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";

			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";

			await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
			let abProject = fs.readFileSync(path.join(tempFolder, ".abproject"));
			let correctABProject = fs.readFileSync(path.join(__dirname, "/resources/blank-NativeScript.abproject"));
			let testProperties = JSON.parse(abProject.toString());
			let correctProperties = JSON.parse(correctABProject.toString());

			let projectSchema = await project.getProjectSchema();
			let guidRegex = new RegExp(projectSchema.ProjectGuid.regex);

			assert.ok(guidRegex.test(testProperties.ProjectGuid));
			delete testProperties.ProjectGuid;

			assert.deepEqual(Object.keys(testProperties).sort(), Object.keys(correctProperties).sort());
			for (let key in testProperties) {
				assert.deepEqual(testProperties[key], correctProperties[key]);
			}
		});
	});

	describe("updateProjectPropertiesAndSave", () => {
		let prompter: PrompterStub;
		beforeEach(async () => {
			prompter = testInjector.resolve("prompter");
			prompter.confirmResult = true;
			let tempFolder = temp.mkdirSync("template");
			options = testInjector.resolve("options");
			options.path = tempFolder;
			options.template = "Blank";
			options.appid = "com.telerik.Test";
			let projectName = "Test";
			project = testInjector.resolve("project");
			await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
			options.debug = options.release = false;
			await project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.7.0"]);
		});

		it("updates WPSdk to 8.0 when Cordova is downgraded from 3.7.0", async () => {
			await project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]);
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk must be 8.1");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must be 3.7.0");

			await project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]);

			assert.strictEqual(project.projectData.WPSdk, "8.0", "WPSdk must be downgraded to 8.0 when downgrading Cordova version from 3.7.0");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.5.0", "Cordova version should have been migrated to 3.7.0");
		});

		it("updates FrameworkVersion to 3.7.0 when WPSdk is updated to 8.1", async () => {
			await project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]);
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must be updated to 3.7.0 when WPSdk is updated to 8.1");
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk should have been updated to 8.1");
		});

		it("does not update FrameworkVersion to 3.7.0 when trying to update WPSdk to 8.1 but user refuses", async () => {
			prompter.confirmResult = false;
			await project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]);
			await assert.isRejected(project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]), "Unable to set Windows Phone %s as the target SDK. Migrate to Apache Cordova 3.7.0 or later and try again.");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.5.0", "Cordova version must stay to 3.5.0 when user refuses to upgrade WPSdk to 8.1");
			assert.strictEqual(project.projectData.WPSdk, "8.0", "WPSdk version must be 8.0 when user refuses to upgrade it to 8.1");
		});

		it("does not update WPSdk to 8.0 when trying to update FrameworkVersion to 3.5.0 but user refuses", async () => {
			// First set WPSdk to 8.1 and FrameworkVersion to 3.7.0
			prompter.confirmResult = true;
			await project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]);
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must be 3.7.0.");

			prompter.confirmResult = false;
			await assert.isRejected(project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]), "Unable to set %s as the target Apache Cordova version. Set the target Windows Phone SDK to 8.0 and try again.");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version must stay to 3.7.0 when user refuses to downgrade WPSdk to 8.0");
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk version must be 8.1 when user refuses to downgrade it to 8.1");
		});

		it("does not prompt for WPSdk downgrade to 8.0 when Cordova is downgraded from 3.7.0 and WPSdk is already 8.0", async () => {
			await project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.7.0"]);
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version should have been migrated to 3.7.0");
			prompter.confirmCalled = false;
			await project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.5.0"]);
			assert.isFalse(prompter.confirmCalled, "We have prompted for confirmation to change WPSdk to 8.0, but it is already 8.0. DO NOT PROMPT HERE!");
			assert.strictEqual(project.projectData.FrameworkVersion, "3.5.0", "Cordova version should have been migrated to 3.5.0");
		});

		it("does not prompt for Cordova upgrade to 3.7.0 when WPSdk is upgraded to 8.1 and FrameworkVersion is already 3.7.0", async () => {
			await project.updateProjectPropertyAndSave("set", "FrameworkVersion", ["3.7.0"]);
			assert.strictEqual(project.projectData.FrameworkVersion, "3.7.0", "Cordova version should have been migrated to 3.7.0");

			await project.updateProjectPropertyAndSave("set", "WPSdk", ["8.0"]);
			assert.strictEqual(project.projectData.WPSdk, "8.0", "WPSdk version should have been migrated to 8.0");
			prompter.confirmCalled = false;
			await project.updateProjectPropertyAndSave("set", "WPSdk", ["8.1"]);
			assert.isFalse(prompter.confirmCalled, "We have prompted for confirmation to change Cordova version to 3.7.0, but it is already 3.7.0. DO NOT PROMPT HERE!");
			assert.strictEqual(project.projectData.WPSdk, "8.1", "WPSdk version should have been migrated to 8.0");
		});
	});

	describe("Init command tests", () => {
		let tempFolder: string;
		let projectName = "Test";
		let mobileHelper: Mobile.IMobileHelper;
		beforeEach(() => {
			tempFolder = temp.mkdirSync("template");
			options = testInjector.resolve("options");
			options.path = tempFolder;
			options.appid = "com.telerik.Test";
			mobileHelper = testInjector.resolve("mobileHelper");
			project = testInjector.resolve("project");
		});

		describe("NativeScript project", () => {
			function assertProjectFilesExistAfterInit(projectDir: string): void {
				assert.isTrue(fs.existsSync(path.join(projectDir, projectConstants.PROJECT_FILE)), "After initialization, project does not have .abproject file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, projectConstants.PROJECT_IGNORE_FILE)), "After initialization, project does not have .abignore file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, projectConstants.PACKAGE_JSON_NAME)), "After initialization, project does not have package.json file.");
			};

			function removeProjectFiles(projectDir: string): void {
				fs.unlinkSync(path.join(projectDir, projectConstants.PROJECT_FILE));
				fs.unlinkSync(path.join(projectDir, projectConstants.PROJECT_IGNORE_FILE));
				fs.unlinkSync(path.join(projectDir, projectConstants.PACKAGE_JSON_NAME));
			}

			it("Blank template has all mandatory files", async () => {
				options.template = "Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
				let projectDir = project.getProjectDir();
				let packageJson = path.join(projectDir, projectConstants.PACKAGE_JSON_NAME);
				assert.isTrue(fs.existsSync(packageJson), "NativeScript Blank template does not contain mandatory 'package.json' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.");
			});

			it("TypeScript.Blank template has mandatory files", async () => {
				options.template = "TypeScript.Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
				let projectDir = project.getProjectDir();
				let packageJson = path.join(projectDir, projectConstants.PACKAGE_JSON_NAME);
				assert.isTrue(fs.existsSync(packageJson), "NativeScript TypeScript.Blank template does not contain mandatory 'package.json' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.");
			});

			it("existing TypeScript.Blank project has project files after init", async () => {
				options.template = "TypeScript.Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
				let projectDir = project.getProjectDir();
				removeProjectFiles(projectDir);
				options.path = projectDir;
				await project.initializeProjectFromExistingFiles(TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
				assertProjectFilesExistAfterInit(projectDir);
			});

			it("existing project has project files after init", async () => {
				options.template = "Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
				let projectDir = project.getProjectDir();
				removeProjectFiles(projectDir);
				options.path = projectDir;
				await project.initializeProjectFromExistingFiles(TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
				assertProjectFilesExistAfterInit(projectDir);
			});

			it("empty directory has project files after init", async () => {
				options.path = tempFolder;
				await project.initializeProjectFromExistingFiles(TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
				assertProjectFilesExistAfterInit(tempFolder);
			});
		});

		describe("Cordova project", () => {
			function assertProjectFilesExistAfterInit(projectDir: string): void {
				assert.isTrue(fs.existsSync(path.join(projectDir, projectConstants.PROJECT_FILE)), "After initialization, project does not have .abproject file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, projectConstants.PROJECT_IGNORE_FILE)), "After initialization, project does not have .abignore file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, projectConstants.DEBUG_PROJECT_FILE_NAME)), "After initialization, project does not have .debug.abproject file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, projectConstants.RELEASE_PROJECT_FILE_NAME)), "After initialization, project does not have .release.abproject file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, "cordova.android.js")), "After initialization, project does not have cordova.android.js file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, "cordova.ios.js")), "After initialization, project does not have cordova.ios.js file.");
				assert.isTrue(fs.existsSync(path.join(projectDir, "cordova.wp8.js")), "After initialization, project does not have cordova.wp8.js file.");
			};

			function removeProjectFiles(projectDir: string): void {
				fs.unlinkSync(path.join(projectDir, projectConstants.PROJECT_FILE));
				fs.unlinkSync(path.join(projectDir, projectConstants.PROJECT_IGNORE_FILE));
				fs.unlinkSync(path.join(projectDir, projectConstants.RELEASE_PROJECT_FILE_NAME));
				fs.unlinkSync(path.join(projectDir, projectConstants.DEBUG_PROJECT_FILE_NAME));
				mobileHelper.platformNames.forEach(platform => {
					fs.unlinkSync(path.join(projectDir, `cordova.${platform.toLowerCase()}.js`));
				});
			}

			it("existing project has configuration specific files and .abignore files after init", async () => {
				options.template = "Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				let projectDir = project.getProjectDir();
				removeProjectFiles(projectDir);
				options.path = projectDir;
				await project.initializeProjectFromExistingFiles(TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				assertProjectFilesExistAfterInit(projectDir);
			});

			it("empty directory has project files after init", async () => {
				options.path = tempFolder;
				await project.initializeProjectFromExistingFiles(TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				assertProjectFilesExistAfterInit(tempFolder);
			});

			it("Blank template has all mandatory files", async () => {
				options.template = "Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				let projectDir = project.getProjectDir();

				_.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), `Cordova Blank template does not contain mandatory '${cordovaFile}' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.`);
				});
			});

			it("TypeScript.Blank template has mandatory files", async () => {
				options.template = "TypeScript.Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				let projectDir = project.getProjectDir();

				_.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), `Cordova TypeScript.Blank template does not contain mandatory '${cordovaFile}' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.`);
				});
			});

			it("KendoUI.Drawer template has mandatory files", async () => {
				options.template = "KendoUI.Drawer";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				let projectDir = project.getProjectDir();

				_.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), `Cordova KendoUI.Drawer template does not contain mandatory '${cordovaFile}' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.`);
				});
			});

			it("When KendoUI.Blank is specified use KendoUI.Empty", async () => {
				options.template = "KendoUI.Blank";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				let projectDir = project.getProjectDir();

				_.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = `cordova.${platform.toLowerCase()}.js`;
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), `Cordova KendoUI.Blank template does not contain mandatory '${cordovaFile}' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.`);
				});
			});

			it("KendoUI.Empty template has mandatory files", async () => {
				options.template = "KendoUI.Empty";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				let projectDir = project.getProjectDir();

				_.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), `Cordova KendoUI.Empty template does not contain mandatory '${cordovaFile}' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.`);
				});
			});

			it("KendoUI.TabStrip template has mandatory files", async () => {
				options.template = "KendoUI.TabStrip";
				await project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
				let projectDir = project.getProjectDir();

				_.forEach(mobileHelper.platformNames, platform => {
					let cordovaFile = util.format("cordova.%s.js", platform).toLowerCase();
					assert.isTrue(fs.existsSync(path.join(projectDir, cordovaFile)), `Cordova KendoUI.TabStrip template does not contain mandatory '${cordovaFile}' file. This file is required in init command. You should check if this is problem with the template or change init command to use another file.`);
				});
			});
		});
	});

	describe("createTemplateFolder", () => {
		it("creates project folder when folder with that name doesn't exists", () => {
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";
			let projectFolder = path.join(tempFolder, projectName);

			project.createTemplateFolder(projectFolder);
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("doesn't fail when folder with that name exists and it's empty", () => {
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";
			let projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			project.createTemplateFolder(projectFolder);
			assert.isTrue(fs.existsSync(projectFolder));
		});

		it("fails when project folder is not empty", () => {
			let tempFolder = temp.mkdirSync("template");
			let projectName = "Test";
			let projectFolder = path.join(tempFolder, projectName);

			fs.mkdirSync(projectFolder);
			fs.closeSync(fs.openSync(path.join(projectFolder, "temp"), "a", 666));
			assert.throws(() => project.createTemplateFolder(projectFolder));
		});
	});
});

function getProjectData(): Project.IData {
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
		"CorePlugins": [],
		"CordovaPluginVariables": {},
		"WPSdk": "8.0",
		"iOSDeploymentTarget": "8.0"
	};
}

describe("project unit tests", () => {
	let projectProperties: IProjectPropertiesService, testInjector: IInjector, options: IOptions;
	let configSpecificData: any;
	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);

		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		let config = testInjector.resolve("config");
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.PROJECT_FILE_NAME = "";
		config.AUTO_UPGRADE_PROJECT_FILE = false;
		configSpecificData = undefined;
		projectProperties = testInjector.resolve(projectPropertiesLib.ProjectPropertiesService);
		options = testInjector.resolve("options");
	});

	describe("updateProjectProperty", () => {
		it("sets unconstrained string property", async () => {
			let projectData = getProjectData();
			projectData.DisplayName = "wrong";
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "set", "DisplayName", ["fine"]);
			assert.equal("fine", projectData.DisplayName);
		});

		it("sets string property with custom validator", async () => {
			let projectData = getProjectData();
			projectData.ProjectName = "wrong";
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "set", "ProjectName", ["fine"]);
			assert.equal("fine", projectData.ProjectName);
		});

		it("disallows 'add' on non-flag property", async () => {
			let projectData = getProjectData();
			projectData.ProjectName = "wrong";
			await assert.isRejected(projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "ProjectName", ["fine"]), "Unable to add value to non-flags property");
		});

		it("disallows 'del' on non-flag property", async () => {
			let projectData = getProjectData();
			projectData.ProjectName = "wrong";
			await assert.isRejected(projectProperties.updateProjectProperty(projectData, configSpecificData, "del", "ProjectName", ["fine"]), "Unable to remove value to non-flags property");
		});

		it("sets bundle version when given proper input", async () => {
			let projectData = getProjectData();
			projectData.BundleVersion = "0";
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "set", "BundleVersion", ["10.20.30"]);
			assert.equal("10.20.30", projectData.BundleVersion);
		});

		it("throws on invalid bundle version string", async () => {
			let projectData = getProjectData();
			projectData.BundleVersion = "0";
			await assert.isRejected(projectProperties.updateProjectProperty(projectData, configSpecificData, "set", "BundleVersion", ["10.20.30c"]), "Schema validation failed with following errors: \n Property BundleVersion: String does not match pattern. /^(\\d+)(\\.\\d+)(\\.\\d+)?(\\.\\d+)?$/");
		});

		it("sets enumerated property", async () => {
			let projectData = getProjectData();
			projectData.iOSStatusBarStyle = "Default";
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "set", "iOSStatusBarStyle", ["Hidden"]);
			assert.equal("Hidden", projectData.iOSStatusBarStyle);
		});

		it("disallows unrecognized values for enumerated property", async () => {
			let projectData = getProjectData();
			projectData.iOSStatusBarStyle = "Default";
			await assert.isRejected(projectProperties.updateProjectProperty(projectData, configSpecificData, "set", "iOSStatusBarStyle", ["does not exist"]), "Schema validation failed with following errors: \n Property iOSStatusBarStyle: Instance is not one of the possible values. Default,BlackTranslucent,BlackOpaque,Hidden");
		});

		it("appends to verbatim enumerated collection property", async () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "DeviceOrientations", ["Portrait"]);
			assert.deepEqual(["Portrait"], projectData.DeviceOrientations);
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "DeviceOrientations", ["Landscape"]);
			assert.deepEqual(["Portrait", "Landscape"], projectData.DeviceOrientations);
		});

		it("appends to enumerated collection property with shorthand", async () => {
			let projectData = getProjectData();
			projectData.iOSDeviceFamily = [];
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "iOSDeviceFamily", ["1"]);
			assert.deepEqual(["1"], projectData.iOSDeviceFamily);
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "iOSDeviceFamily", ["2"]);
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("appends multiple values to enumerated collection property", async () => {
			let projectData = getProjectData();
			projectData.iOSDeviceFamily = [];
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "iOSDeviceFamily", ["1", "2"]);
			assert.deepEqual(["1", "2"], projectData.iOSDeviceFamily);
		});

		it("removes from enumerated collection property", async () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = ["Landscape", "Portrait"];
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "del", "DeviceOrientations", ["Portrait"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "del", "DeviceOrientations", ["Portrait"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("disallows unrecognized values for enumerated collection property", async () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			await assert.isRejected(projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "DeviceOrientations", ["Landscape", "bar"]), "Schema validation failed with following errors: \n Property items: Instance is not one of the possible values. Portrait,Landscape");
		});

		it("makes case-insensitive comparisons of property name", async () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "deviceorientations", ["Landscape"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("makes case-insensitive comparisons of property values", async () => {
			let projectData = getProjectData();
			projectData.DeviceOrientations = [];
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "DeviceOrientations", ["Landscape"]);
			assert.deepEqual(["Landscape"], projectData.DeviceOrientations);
		});

		it("adds CorePlugins to configuration specfic data when it is specified", async () => {
			// this is the equivalent of $ appbuilder prop set CorePlugins A B C --debug
			let projectData = getProjectData();
			configSpecificData = {
				"CorePlugins": ["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.contacts"]
			};

			await projectProperties.updateProjectProperty(projectData, configSpecificData, "add", "CorePlugins", ["org.apache.cordova.file"]);
			assert.deepEqual([], projectData.CorePlugins);
			assert.deepEqual({
				"CorePlugins": ["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.contacts",
					"org.apache.cordova.file"]
			}, configSpecificData);
		});

		it("removes value from configuration specfic data when CorePlugins are modified in it", async () => {
			// this is the equivalent of $ appbuilder prop remove CorePlugins A B C --debug
			let projectData = getProjectData();
			configSpecificData = {
				"CorePlugins": ["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.contacts"]
			};
			await projectProperties.updateProjectProperty(projectData, configSpecificData, "del", "CorePlugins", ["org.apache.cordova.contacts"]);
			assert.deepEqual([], projectData.CorePlugins, "CorePlugins in project data should not be modified.");
			assert.deepEqual({
				"CorePlugins": ["org.apache.cordova.battery-status",
					"org.apache.cordova.camera"]
			}, configSpecificData, "CorePlugins in configuration specific data should be modified.");
		});

		it("sets CorePlugins to configuration specfic data when it is specified", async () => {
			// this is the equivalent of $ appbuilder prop set CorePlugins A B C --debug
			let projectData = getProjectData();
			configSpecificData = {
				"CorePlugins": ["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.contacts"]
			};

			await projectProperties.updateProjectProperty(projectData, configSpecificData, "set", "CorePlugins", ["org.apache.cordova.file", "org.apache.cordova.camera"]);
			assert.deepEqual([], projectData.CorePlugins);
			assert.deepEqual({
				"CorePlugins": ["org.apache.cordova.file",
					"org.apache.cordova.camera"]
			}, configSpecificData);
		});
	});
	describe("updateCorePlugins", () => {
		describe("modifies CorePlugins in configuration specific data, when it is specified", () => {
			let projectData: Project.IData;

			beforeEach(() => {
				projectData = getProjectData();
				configSpecificData = {
					debug: {
						CorePlugins: ["org.apache.cordova.battery-status",
							"org.apache.cordova.camera",
							"org.apache.cordova.contacts"]
					},
					release: {
						CorePlugins: ["org.apache.cordova.battery-status",
							"org.apache.cordova.camera",
							"org.apache.cordova.geolocation"]
					}
				};
			});

			it("adds CorePlugins to configuration specfic data when it is specified", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "add", ["org.apache.cordova.file"], ["debug"]);
				assert.deepEqual(undefined, projectData.CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.contacts",
					"org.apache.cordova.file"],
					configSpecificData["debug"].CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.geolocation"],
					configSpecificData["release"].CorePlugins);
			});

			it("removes CorePlugin from debug configuration data when it is specified", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "del", ["org.apache.cordova.camera"], ["debug"]);
				assert.deepEqual(undefined, projectData.CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.contacts"],
					configSpecificData["debug"].CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.geolocation"],
					configSpecificData["release"].CorePlugins);
			});

			it("sets CorePlugins to debug configuration when it is specified", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "set", ["org.apache.cordova.file"], ["debug"]);
				assert.deepEqual(undefined, projectData.CorePlugins);

				assert.deepEqual(["org.apache.cordova.file"],
					configSpecificData["debug"].CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.geolocation"],
					configSpecificData["release"].CorePlugins);
			});
		});

		describe("moves CorePlugins to projectData when they are the same in config files", () => {
			it("after prop add", async () => {
				configSpecificData = {
					debug: {
						CorePlugins: ["org.apache.cordova.battery-status"]
					},
					release: {
						CorePlugins: ["org.apache.cordova.battery-status",
							"org.apache.cordova.geolocation"]
					}
				};
				let projectData = getProjectData();
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "add", ["org.apache.cordova.geolocation"], ["debug"]);
				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.geolocation"],
					projectData.CorePlugins);

				assert.deepEqual(undefined, configSpecificData["debug"].CorePlugins);
				assert.deepEqual(undefined, configSpecificData["release"].CorePlugins);
			});

			it("after prop set", async () => {
				configSpecificData = {
					debug: {
						CorePlugins: ["org.apache.cordova.battery-status"]
					},
					release: {
						CorePlugins: ["org.apache.cordova.geolocation"]
					}
				};
				let projectData = getProjectData();
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "set", ["org.apache.cordova.geolocation"], ["debug"]);
				assert.deepEqual(["org.apache.cordova.geolocation"], projectData.CorePlugins);

				assert.deepEqual(undefined, configSpecificData["debug"].CorePlugins);
				assert.deepEqual(undefined, configSpecificData["release"].CorePlugins);
			});

			it("after prop rm", async () => {
				configSpecificData = {
					debug: {
						CorePlugins: ["org.apache.cordova.battery-status",
							"org.apache.cordova.geolocation"]
					},
					release: {
						CorePlugins: ["org.apache.cordova.geolocation"]
					}
				};
				let projectData = getProjectData();
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "del", ["org.apache.cordova.battery-status"], ["debug"]);
				assert.deepEqual(["org.apache.cordova.geolocation"], projectData.CorePlugins);

				assert.deepEqual(undefined, configSpecificData["debug"].CorePlugins);
				assert.deepEqual(undefined, configSpecificData["release"].CorePlugins);
			});
		});

		describe("moves CorePlugins to config specific data when it is modified", () => {
			let projectData: Project.IData;
			beforeEach(() => {
				projectData = getProjectData();
				projectData.CorePlugins = ["org.apache.cordova.battery-status"];
				configSpecificData = {
					debug: {},
					release: {}
				};
			});

			it("after prop add", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "add", ["org.apache.cordova.geolocation"], ["debug"]);
				assert.deepEqual(undefined, projectData.CorePlugins);
				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.geolocation"], configSpecificData["debug"].CorePlugins);
				assert.deepEqual(["org.apache.cordova.battery-status"], configSpecificData["release"].CorePlugins);
			});

			it("after prop set", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "set", ["org.apache.cordova.geolocation"], ["debug"]);
				assert.deepEqual(undefined, projectData.CorePlugins);

				assert.deepEqual(["org.apache.cordova.geolocation"], configSpecificData["debug"].CorePlugins);
				assert.deepEqual(["org.apache.cordova.battery-status"], configSpecificData["release"].CorePlugins);
			});

			it("after prop rm", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "del", ["org.apache.cordova.battery-status"], ["debug"]);
				assert.deepEqual(undefined, projectData.CorePlugins);

				assert.deepEqual([], configSpecificData["debug"].CorePlugins);
				assert.deepEqual(["org.apache.cordova.battery-status"], configSpecificData["release"].CorePlugins);
			});
		});

		describe("modifies CorePlugins in configuration specific data, even if it is NOT specified when CorePlugins are different in the configurations", () => {
			let projectData: Project.IData;

			beforeEach(() => {
				projectData = getProjectData();
				configSpecificData = {
					debug: {
						CorePlugins: ["org.apache.cordova.battery-status",
							"org.apache.cordova.camera",
							"org.apache.cordova.contacts"]
					},
					release: {
						CorePlugins: ["org.apache.cordova.battery-status",
							"org.apache.cordova.camera",
							"org.apache.cordova.geolocation"]
					}
				};
			});

			it("adds CorePlugins to configuration specfic data", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "add", ["org.apache.cordova.file"], []);
				assert.deepEqual(undefined, projectData.CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.contacts",
					"org.apache.cordova.file"],
					configSpecificData["debug"].CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.camera",
					"org.apache.cordova.geolocation",
					"org.apache.cordova.file"],
					configSpecificData["release"].CorePlugins);
			});

			it("removes CorePlugin from all configurations", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "del", ["org.apache.cordova.camera"], []);
				assert.deepEqual(undefined, projectData.CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.contacts"],
					configSpecificData["debug"].CorePlugins);

				assert.deepEqual(["org.apache.cordova.battery-status",
					"org.apache.cordova.geolocation"],
					configSpecificData["release"].CorePlugins);
			});

			it("sets CorePlugins to both configurations when it is specified", async () => {
				await projectProperties.updateCorePlugins(projectData, configSpecificData, "set", ["org.apache.cordova.file"], []);
				assert.deepEqual(["org.apache.cordova.file"], projectData.CorePlugins);

				assert.deepEqual(undefined,
					configSpecificData["debug"].CorePlugins);

				assert.deepEqual(undefined,
					configSpecificData["release"].CorePlugins);
			});
		});

		it("throws exception when different CorePlugins are part of both .abproject and any config specific file", async () => {
			let projectData = getProjectData();
			projectData.CorePlugins = ["org.apache.cordova.battery-status"];
			configSpecificData = {
				debug: {
					CorePlugins: ["org.apache.cordova.contacts"]
				},
				release: {
					CorePlugins: ["org.apache.cordova.camera"]
				}
			};
			await assert.isRejected(projectProperties.updateCorePlugins(projectData, configSpecificData, "add", ["org.apache.cordova.file"], []), "CorePlugins are defined in both \'.abproject\' and \'.debug.abproject\'. Remove them from one of the files and try again.");
			assert.deepEqual(["org.apache.cordova.battery-status"], projectData.CorePlugins);
			assert.deepEqual(["org.apache.cordova.contacts"], configSpecificData["debug"].CorePlugins);
			assert.deepEqual(["org.apache.cordova.camera"], configSpecificData["release"].CorePlugins);
		});

		it("does not throw exception when the same CorePlugins are part of both .abproject and any config specific file", async () => {
			let projectData = getProjectData();
			projectData.CorePlugins = ["org.apache.cordova.battery-status"];
			configSpecificData = {
				debug: {
					CorePlugins: ["org.apache.cordova.battery-status"]
				},
				release: {
					CorePlugins: ["org.apache.cordova.battery-status"]
				}
			};
			await projectProperties.updateCorePlugins(projectData, configSpecificData, "add", ["org.apache.cordova.file"], []);
			assert.deepEqual(["org.apache.cordova.battery-status",
				"org.apache.cordova.file"],
				projectData.CorePlugins);
			assert.deepEqual(undefined, configSpecificData["debug"].CorePlugins);
			assert.deepEqual(undefined, configSpecificData["release"].CorePlugins);
		});
	});
});

describe("project unit tests (canonical paths)", () => {
	let project: any, testInjector: IInjector, oldPath: string, options: IOptions;
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
		options = testInjector.resolve("options");

		oldPath = options.path;
	});
	after(() => {
		options.path = oldPath;
	});

	it("no ending path separator", () => {
		options.path = "test";
		project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test"));
	});

	it("one ending path separator", () => {
		options.path = "test" + path.sep;
		project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test"));
	});

	it("multiple ending path separator", () => {
		options.path = "test" + path.sep + path.sep;
		project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test"));
	});

	it("do not remove separators which are not at the end", () => {
		options.path = "test" + path.sep + "test" + path.sep;
		project = testInjector.resolve(projectlib.Project);
		assert.strictEqual(project.getProjectDir(), path.join(process.cwd(), "test" + path.sep + "test"));
	});
});

describe("cordovaProject unit tests", () => {
	let projectProperties: IProjectPropertiesService, testInjector: IInjector, options: IOptions;

	beforeEach(() => {
		testInjector = createTestInjector();
		testInjector.register("fs", fslib.FileSystem);

		testInjector.register("config", require("../lib/config").Configuration);
		testInjector.register("staticConfig", require("../lib/config").StaticConfig);
		let config = testInjector.resolve("config");
		let staticConfig = testInjector.resolve("staticConfig");
		staticConfig.PROJECT_FILE_NAME = "";
		config.AUTO_UPGRADE_PROJECT_FILE = false;
		options = testInjector.resolve("options");

		projectProperties = testInjector.resolve(projectPropertiesLib.ProjectPropertiesService);
	});

	describe("alterPropertiesForNewProject", () => {
		it("sets correct WP8PackageIdentityName when appid is short", () => {
			let cordovaProject: Project.IFrameworkProject = testInjector.resolve("cordovaProject");
			let props: any = {};
			options.appid = "appId";
			cordovaProject.alterPropertiesForNewProject(props, "name");
			assert.equal(props["WP8PackageIdentityName"], "1234Telerik.appId");
		});

		it("sets correct WP8PackageIdentityName when appid combined with default prefix has 50 symbols length", () => {
			let cordovaProject: Project.IFrameworkProject = testInjector.resolve("cordovaProject");
			let props: any = {};
			let defaultPrefix = "1234Telerik.";
			let value = _.range(0, 50 - defaultPrefix.length).map(num => "a").join("");
			options.appid = value;

			cordovaProject.alterPropertiesForNewProject(props, "name");
			assert.equal(props["WP8PackageIdentityName"], defaultPrefix + value);
		});

		it("sets correct WP8PackageIdentityName when appid combined with default prefix has more than 50 symbols length", () => {
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

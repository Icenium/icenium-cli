import {assert} from "chai";
import Future = require("fibers/future");
import * as path from "path";
import {Yok} from "../lib/common/yok";
import {NativeScriptProject} from "../lib/project/nativescript-project";
import {ProjectConstants} from "../lib/common/appbuilder/project-constants";
import {Configuration, StaticConfig} from "../lib/config";
import {ConfigFilesManager} from "../lib/project/config-files-manager";
import {NativeScriptProjectCapabilities} from "../lib/common/appbuilder/project/nativescript-project-capabilities";
import {FileSystem} from "../lib/common/file-system";
import {Options} from "../lib/options";
import {JsonSchemaConstants} from "../lib/json-schema/json-schema-constants";
import {JsonSchemaLoader} from "../lib/json-schema/json-schema-loader";
import {JsonSchemaResolver} from "../lib/json-schema/json-schema-resolver";
import {JsonSchemaValidator} from "../lib/json-schema/json-schema-validator";
import {MobileHelper} from "../lib/common/mobile/mobile-helper";
import {MobilePlatformsCapabilities} from "../lib/common/appbuilder/mobile-platforms-capabilities";
import {DevicePlatformsConstants} from "../lib/common/mobile/device-platforms-constants";
import {HostInfo} from "../lib/common/host-info";
import {DateProvider} from "../lib/providers/date-provider";
import * as stubs from "./stubs";

let currentDate = new Date(2016, 7, 28, 10);
let returnNewMigrationFileContent: boolean;

function createTestInjector(): IInjector {
	let testInjector = new Yok();

	testInjector.register("nativeScriptProject", NativeScriptProject);
	testInjector.register("projectConstants", ProjectConstants);
	testInjector.register("config", Configuration);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("configFilesManager", ConfigFilesManager);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("templatesService", stubs.TemplateServiceStub);
	testInjector.register("nativeScriptProjectCapabilities", NativeScriptProjectCapabilities);
	testInjector.register("fs", FileSystem);
	testInjector.register("options", Options);
	testInjector.register("jsonSchemaConstants", JsonSchemaConstants);
	testInjector.register("resources", $injector.resolve("resources"));
	testInjector.register("jsonSchemaLoader", JsonSchemaLoader);
	testInjector.register("jsonSchemaResolver", JsonSchemaResolver);
	testInjector.register("jsonSchemaValidator", JsonSchemaValidator);
	testInjector.register("frameworkProjectResolver", {
		resolve: () => testInjector.resolve("nativeScriptProject")
	});
	testInjector.register("httpClient", { /*intentionally empty body */ });
	testInjector.register("nativeScriptMigrationService", { downloadMigrationConfigFile: (targetPath: string): IFuture<void> => Future.fromResult() });
	testInjector.register("nativeScriptResources", { /*intentionally empty body */ });
	testInjector.register("mobileHelper", MobileHelper);
	testInjector.register("mobilePlatformsCapabilities", MobilePlatformsCapabilities);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("dateProvider", DateProvider);
	testInjector.register("injector", testInjector);

	return testInjector;
}

function mockFsForAppResources(requiredResources: string[], resourcesInProject: string[], testInjector: IInjector): { copiedFilesReference: string[] } {
	let $fs: IFileSystem = testInjector.resolve("fs");
	$fs.enumerateFilesInDirectorySync = (directoryPath: string): string[] => requiredResources;

	let copiedFilesReference: string[] = [];

	$fs.copyFile = (sourceFileName: string, destinationFileName: string): IFuture<void> => {
		return (() => {
			copiedFilesReference.push(sourceFileName);
		}).future<void>()();
	};

	$fs.exists = (path: string): IFuture<boolean> => {
		return ((): boolean => {
			return _.some(resourcesInProject, (resource: string) => {
				return path.indexOf(resource) >= 0;
			});
		}).future<boolean>()();
	};

	return { copiedFilesReference };
}

function mockFsStats($fs: any, options: { hoursToAddToMtime: number }): void {
	let modifiedDate = new Date(currentDate.getTime());
	modifiedDate.setHours(currentDate.getHours() + options.hoursToAddToMtime);

	$fs.getFsStats = (): IFuture<any> => Future.fromResult({ mtime: modifiedDate });
}

function mockFsReadText($fs: IFileSystem, modifiedNativeScriptMigrationFile: any, currentNativeScriptMigrationFile: any): void {
	$fs.readText = (fileName: string): IFuture<string> => {
		return ((): string => {
			if (returnNewMigrationFileContent) {
				returnNewMigrationFileContent = false;
				return JSON.stringify(modifiedNativeScriptMigrationFile);
			}

			return JSON.stringify(currentNativeScriptMigrationFile);
		}).future<string>()();
	};
}

describe("NativeScript project unit tests", () => {
	let testInjector: IInjector;
	let nativeScriptProject: Project.IFrameworkProject;

	beforeEach(() => {
		testInjector = createTestInjector();
		nativeScriptProject = testInjector.resolve("nativeScriptProject");
	});

	describe("Get template file name", () => {
		it("should return the correct TypeScript template file name.", () => {
			let expectedTemplateName = "Telerik.Mobile.NS.TS.Blank.zip";
			let actualTemplateName = nativeScriptProject.getTemplateFilename("TypeScript.Blank");

			assert.deepEqual(actualTemplateName, expectedTemplateName);
		});

		it("should return the correct JavaScript template file name.", () => {
			let expectedTemplateName = "Telerik.Mobile.NS.Blank.zip";
			let actualTemplateName = nativeScriptProject.getTemplateFilename("Blank");

			assert.deepEqual(actualTemplateName, expectedTemplateName);
		});
	});

	describe("Alter properties for new project", () => {
		it("should set the DisplayName and Description correctly.", () => {
			let properties: { DisplayName: string, Description: string } = {
				DisplayName: null,
				Description: null
			};

			let projectName = "myapp";

			nativeScriptProject.alterPropertiesForNewProject(properties, projectName);

			assert.deepEqual(properties.DisplayName, projectName);
			assert.deepEqual(properties.Description, projectName);
		});

		it("should respect the app identifier from the options.", () => {
			let properties: { AppIdentifier: string } = {
				AppIdentifier: null
			};

			let projectName = "myapp";
			let appIdentifier = "com.telerik.mycustomappid";

			let $options: IOptions = testInjector.resolve("options");
			$options.appid = appIdentifier;

			nativeScriptProject.alterPropertiesForNewProject(properties, projectName);
			assert.deepEqual(properties.AppIdentifier, appIdentifier);
		});

		it("should generate default app identifier if there is no $options.appid.", () => {
			let properties: { AppIdentifier: string } = {
				AppIdentifier: null
			};

			let projectName = "my-app-name";

			nativeScriptProject.alterPropertiesForNewProject(properties, projectName);
			assert.deepEqual(properties.AppIdentifier, "com.telerik.myappname");
		});
	});

	describe("Ensure all platform assets", () => {
		let androidDirectoryName = "Android";
		let iosDirectoryName = "iOS";
		let appGradleFile = path.join(androidDirectoryName, "app.gradle");
		let androidIcon = path.join(androidDirectoryName, "drawable-hdpi", "icon.png");
		let androidSplashScreen = path.join(androidDirectoryName, "drawable-hdpi", "icon.png");

		let iosDefaultIcon = path.join(iosDirectoryName, "Default.png");
		let iosIcon = path.join(iosDirectoryName, "icon.png");
		let requiredResources = [
			appGradleFile,
			androidIcon,
			androidSplashScreen,
			iosDefaultIcon,
			iosIcon
		];

		it("should add all required resources if there are no resources in the project.", () => {
			let resourcesInProject: string[] = [];
			let expectedResourcesToBeAdded = _.difference(requiredResources, resourcesInProject);

			let copiedFilesReference = mockFsForAppResources(requiredResources, resourcesInProject, testInjector).copiedFilesReference;

			nativeScriptProject.ensureAllPlatformAssets("myapp", "2.1.0").wait();

			assert.deepEqual(copiedFilesReference.length, requiredResources.length);
			assert.sameMembers(copiedFilesReference, expectedResourcesToBeAdded);
		});

		it("should add only missing app resources.", () => {
			let resourcesInProject = [androidIcon, iosIcon];
			let expectedResourcesToBeAdded = _.difference(requiredResources, resourcesInProject);

			let copiedFilesReference = mockFsForAppResources(requiredResources, resourcesInProject, testInjector).copiedFilesReference;

			nativeScriptProject.ensureAllPlatformAssets("myapp", "2.1.0").wait();

			assert.deepEqual(copiedFilesReference.length, expectedResourcesToBeAdded.length);
			assert.sameMembers(copiedFilesReference, expectedResourcesToBeAdded);
		});
	});

	describe("Get plugin variables info", () => {
		let $fs: IFileSystem;

		beforeEach(() => {
			$fs = testInjector.resolve("fs");
		});

		it("should return null if the package.json of the project is invalid.", () => {
			$fs.readJson = (): IFuture<any> => Future.fromResult({});

			let pluginVariablesInfo = nativeScriptProject.getPluginVariablesInfo(null, "myapp").wait();
			assert.deepEqual(pluginVariablesInfo, null);
		});

		it("should return correct information.", () => {
			let pluginName = "test-plugin";
			let dependencies: any = {};
			dependencies[pluginName] = "1.0.0";
			let pluginVariablesPropertyName = `${pluginName}-variables`;
			let pluginVariables = {
				"APP_ID": {},
				"API_KEY": {
					default: "123456789"
				}
			};
			let nativescript: any = {};
			nativescript[pluginVariablesPropertyName] = pluginVariables;

			let packageJson: any = {
				nativescript,
				dependencies
			};

			$fs.readJson = (): IFuture<any> => Future.fromResult(packageJson);

			let pluginVariablesInfo = nativeScriptProject.getPluginVariablesInfo(null, "myapp").wait();

			let expectedResult: any = {};
			expectedResult[pluginName] = pluginVariables;

			assert.deepEqual(pluginVariablesInfo, expectedResult);
		});
	});

	describe("Update migration configuration file", () => {
		let $fs: IFileSystem;
		let hasChangedTheMigrationFile: boolean;
		let $dateProvider: IDateProvider;
		let currentNativeScriptMigrationFile: any = {
			"supportedVersions": [
				{ "version": "2.1.0", "displayName": "2.1.0", "modulesVersion": "2.1.0" }
			],
			"deprecatedVersions": [],
			"deletedVersions": [
				{ "version": "1.5.2" }
			],
			"npmVersions": [
				{ "version": "2.0.0" }
			]
		};
		let modifiedNativeScriptMigrationFile: any = {
			"supportedVersions": [
				{ "version": "2.1.0", "displayName": "2.1.0", "modulesVersion": "2.1.0" },
				{ "version": "2.2.0", "displayName": "2.2.0", "modulesVersion": "2.2.0" }
			],
			"deprecatedVersions": [],
			"deletedVersions": [
				{ "version": "1.5.2" }
			],
			"npmVersions": [
				{ "version": "2.0.0" },
				{ "version": "2.1.0" }
			]
		};
		let changedMigrationFileContent: any;

		beforeEach(() => {
			$fs = testInjector.resolve("fs");
			$fs.writeFile = (fileName: string, data: any): IFuture<void> => {
				return (() => {
					changedMigrationFileContent = JSON.parse(data);
					hasChangedTheMigrationFile = true;
				}).future<void>()();
			};

			$dateProvider = testInjector.resolve("dateProvider");
			$dateProvider.getCurrentDate = (): Date => currentDate;

			returnNewMigrationFileContent = true;
			hasChangedTheMigrationFile = false;
			changedMigrationFileContent = null;
		});

		it("should update the configuration file if the current file has different content.", () => {
			mockFsStats($fs, { hoursToAddToMtime: -3 });
			mockFsReadText($fs, modifiedNativeScriptMigrationFile, currentNativeScriptMigrationFile);

			nativeScriptProject.updateMigrationConfigFile().wait();

			assert.isTrue(hasChangedTheMigrationFile.valueOf());
			assert.deepEqual(changedMigrationFileContent, modifiedNativeScriptMigrationFile);
		});

		it("should not update the configuration file if the current file has been changed in the past 2 hours.", () => {
			mockFsStats($fs, { hoursToAddToMtime: -1 });
			mockFsReadText($fs, modifiedNativeScriptMigrationFile, currentNativeScriptMigrationFile);

			nativeScriptProject.updateMigrationConfigFile().wait();

			assert.isFalse(hasChangedTheMigrationFile.valueOf());
			assert.deepEqual(changedMigrationFileContent, null);
		});

		it("should not update the configuration file if the current file has no changes.", () => {
			mockFsStats($fs, { hoursToAddToMtime: -3 });
			mockFsReadText($fs, currentNativeScriptMigrationFile, currentNativeScriptMigrationFile);

			nativeScriptProject.updateMigrationConfigFile().wait();

			assert.isFalse(hasChangedTheMigrationFile.valueOf());
			assert.deepEqual(changedMigrationFileContent, null);
		});
	});
});

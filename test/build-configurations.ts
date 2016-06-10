import cordovaPluginsService = require("./../lib/services/cordova-plugins");
import cordovaProjectLib = require("./../lib/project/cordova-project");
import cordovaProjectPluginsService = require("../lib/services/cordova-project-plugins-service");
import frameworkProjectResolverLib = require("../lib/project/resolvers/framework-project-resolver");
import childProcess = require("../lib/common/child-process");
import fslib = require("./../lib/common/file-system");
import marketplacePluginsService = require("./../lib/services/marketplace-plugins-service");
import projectLib = require("./../lib/project");
import projectPropertiesLib = require("../lib/services/project-properties-service");
import projectConstantsLib = require("../lib/common/appbuilder/project-constants");
import jsonSchemaConstantsLib = require("../lib/json-schema/json-schema-constants");
import stubs = require("./stubs");
import yok = require("../lib/common/yok");
import mobileHelperLib = require("../lib/common/mobile/mobile-helper");
import mobilePlatformsCapabilitiesLib = require("../lib/common/appbuilder/mobile-platforms-capabilities");
import devicePlatformsLib = require("../lib/common/mobile/device-platforms-constants");
import hostInfoLib = require("../lib/common/host-info");
import optionsLib = require("../lib/options");
import assert = require("assert");
import Future = require("fibers/future");
import {ConfigFilesManager} from "../lib/project/config-files-manager";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../lib/common/constants";
import * as path from "path";
import temp = require("temp");
import * as util from "util";
temp.track();

let mockProjectNameValidator = {
	validateCalled: false,
	validate: () => {
		mockProjectNameValidator.validateCalled = true;
		return true;
	}
};

function getCordovaPluginsData(cordovaPlugins: string[]): any[] {
	let cordovaPluginsData: any[] = [];
	_.each(cordovaPlugins, (cordovaPlugin: string) => {
		cordovaPluginsData.push({
			Name: _.last(cordovaPlugin.split(".")),
			Identifier: cordovaPlugin
		});
	});

	return cordovaPluginsData;
}

function createMarketplacePluginsData(marketplacePlugins: any[]) {
	let json = '[';
	let index = 0;
	_.each(marketplacePlugins, plugin => {
		let uniqueId = plugin.Identifier;
		let version = plugin.Version;
		let title = _.last(uniqueId.split("."));
		let obj = util.format('{"title": "%s", "uniqueId": "%s", "pluginVersion": "%s","downloadsCount": "24","Url": "","demoAppRepositoryLink": ""}',
			title, uniqueId, version);
		if(++index !== marketplacePlugins.length) {
			json += obj + ",";
		} else {
			json += obj;
		}
	});
	json += ']';

	return json;
}

function createTestInjector() {
	let testInjector = new yok.Yok();
	testInjector.register("childProcess", childProcess.ChildProcess);
	testInjector.register("project", projectLib.Project);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("opener", stubs.OpenerStub);
	testInjector.register("config", require("../lib/config").Configuration);
	testInjector.register("staticConfig", require("../lib/config").StaticConfig);
	testInjector.register("server", {});
	testInjector.register("ionicProjectTransformator", {});
	testInjector.register("cordovaResources", {});
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
	testInjector.register("frameworkProjectResolver", frameworkProjectResolverLib.FrameworkProjectResolver);
	testInjector.register("cordovaProject", cordovaProjectLib.CordovaProject);
	testInjector.register("serverExtensionsService", {});
	testInjector.register("projectConstants", projectConstantsLib.ProjectConstants);
	testInjector.register("projectFilesManager", stubs.ProjectFilesManager);
	testInjector.register("jsonSchemaValidator", {
		validate: (data: Project.IData) => { /* mock */ },
		validateWithBuildSchema: (data: Project.IData, platformName: string): void => {/* mock */},
		validatePropertyUsingBuildSchema: (propertyName: string, propertyValue: string): void => {/* mock */}
	});

	testInjector.register("cordovaPluginsService",  cordovaPluginsService.CordovaPluginsService);
	testInjector.register("cordovaProjectPluginsService", cordovaProjectPluginsService.CordovaProjectPluginsService);
	testInjector.register("marketplacePluginsService", marketplacePluginsService.MarketplacePluginsService);
	testInjector.register("prompter", {});
	testInjector.register("multipartUploadService", {});
	testInjector.register("progressIndicator", {});

	testInjector.register("fs", fslib.FileSystem);
	testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);
	testInjector.register("jsonSchemaConstants", jsonSchemaConstantsLib.JsonSchemaConstants);
	testInjector.register("mobileHelper", mobileHelperLib.MobileHelper);
	testInjector.register("devicePlatformsConstants", devicePlatformsLib.DevicePlatformsConstants);
	testInjector.register("mobilePlatformsCapabilities", mobilePlatformsCapabilitiesLib.MobilePlatformsCapabilities);
	testInjector.register("loginManager", {
		ensureLoggedIn: (): IFuture<void> => {
			return Future.fromResult();
		}
	});
	testInjector.register("hostInfo", hostInfoLib.HostInfo);
	testInjector.register("options", optionsLib.Options);
	testInjector.register("configFilesManager", ConfigFilesManager);
	testInjector.register("nativeScriptProjectCapabilities", {});
	testInjector.register("cordovaProjectCapabilities", {});
	return testInjector;
}

function updateTestInjector(testInjector: IInjector, cordovaPlugins: any[], availableMarketplacePlugins: any[]) {
	// Register mocked server
	testInjector.register("server", {
		cordova: {
			getPlugins: () => {
				return Future.fromResult(cordovaPlugins);
			},
			getMarketplacePluginData: (pluginIdentifier: string, pluginVersion: string) => {
				return Future.fromResult(_.find(availableMarketplacePlugins, p => p.Identifier === pluginIdentifier && p.Version === pluginVersion));
			},
			getMarketplacePluginsData: () => {
				return Future.fromResult(cordovaPlugins);
			}
		}
	});

	// Register mocked httpClient
	testInjector.register("httpClient", {
		httpRequest: (): IFuture<any> => {
			return Future.fromResult({
				body: createMarketplacePluginsData(availableMarketplacePlugins)
			});
		}
	});
}

function getProjectFileName(configuration: string) {
	let projectFileName = ".abproject";
	if (configuration) {
		if (configuration === "debug") {
			projectFileName = ".debug.abproject";
		}
		if (configuration === "release") {
			projectFileName = ".release.abproject";
		}
	}

	return projectFileName;
}

function assertCorePluginsCount(configuration?: string) {
	let testInjector = createTestInjector();
	let options = testInjector.resolve("options");
	let project = testInjector.resolve("project");
	let fs = testInjector.resolve("fs");

	// Create new project
	let tempFolder = temp.mkdirSync("template");

	let projectName = "Test";
	options.path = tempFolder;
	options.template = "Blank";
	options.appid = "com.telerik.Test";
	if (configuration === "debug") {
		options.release = false;
		options.debug = true;
	} else if(configuration === "release") {
		options.debug = false;
		options.release = true;
	}

	project.createNewProject(projectName, TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();

	let availableMarketplacePlugins = [
		{
			Identifier: "nl.x-services.plugins.toast",
			Name: "Toast",
			Version: "2.0.1"
		},
		{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4"
		}
	];

	let projectFilePath = path.join(tempFolder, getProjectFileName(configuration));
	let abProjectContent = fs.readJson(projectFilePath).wait();

	updateTestInjector(testInjector, getCordovaPluginsData(abProjectContent["CorePlugins"]), availableMarketplacePlugins);
	let service: IPluginsService = testInjector.resolve("cordovaProjectPluginsService");
	project.getProperty = (propertyName: string, _configuration: string) => {
		return abProjectContent[propertyName];
	};

	assert.equal(abProjectContent["CorePlugins"].length, service.getInstalledPlugins().length);
}

describe("build-configurations-integration-tests", () => {
	it("Asserts the count of installed plugins in debug configuration", () => {
		assertCorePluginsCount("debug");
	});
	it("Asserts the count of installed plugins in release configuration", () => {
		assertCorePluginsCount("release");
	});
});

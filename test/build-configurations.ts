///<reference path=".d.ts"/>
"use strict";

import cordovaPluginsService = require("./../lib/services/cordova-plugins");
import fslib = require("./../lib/common/file-system");
import helpers = require("../lib/common/helpers");
import marketplacePluginsService = require("./../lib/services/marketplace-plugins-service");
import pluginsService = require("./../lib/services/plugins-service");
import projectLib = require("./../lib/project");
import projectPropertiesLib = require("../lib/services/project-properties-service");
import projectTypeslib = require("../lib/project-types");
import stubs = require("./stubs");
import yok = require("../lib/common/yok");

import assert = require("assert");
import Future = require("fibers/future");
import path = require("path");
import temp = require("temp");
import util = require("util");
temp.track();

var mockProjectNameValidator = {
	validateCalled: false,
	validate: () => {
		mockProjectNameValidator.validateCalled = true;
		return true;
	}
};

function getCordovaPluginsData(cordovaPlugins: string[]): any[] {
	var cordovaPluginsData: any[] = [];
	_.each(cordovaPlugins, (cordovaPlugin: string) => {
		cordovaPluginsData.push({
			Name: _.last(cordovaPlugin.split(".")),
			Identifier: cordovaPlugin
		});
	});

	return cordovaPluginsData;
}

function createMarketplacePluginsData(marketplacePlugins: any[]) {
	var json = '[';
	var index = 0;
	_.each(marketplacePlugins, plugin => {
		var uniqueId = plugin.Identifier;
		var version = plugin.Version;
		var title = _.last(uniqueId.split("."));
		var obj = util.format('{"title": "%s", "uniqueId": "%s", "pluginVersion": "%s","downloadsCount": "24","Url": "","demoAppRepositoryLink": ""}',
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
	var testInjector = new yok.Yok();
	testInjector.register("project", projectLib.Project);

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
	testInjector.register("projectTypes", projectTypeslib);

	testInjector.register("cordovaPluginsService",  cordovaPluginsService.CordovaPluginsService);
	testInjector.register("marketplacePluginsService", marketplacePluginsService.MarketplacePluginsService);
	testInjector.register("prompter", {});

	testInjector.register("fs", fslib.FileSystem);
	testInjector.register("projectPropertiesService", projectPropertiesLib.ProjectPropertiesService);

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
	var projectFileName = ".abproject";
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
	var testInjector = createTestInjector();
	var projectTypes = testInjector.resolve("projectTypes");
	var project = testInjector.resolve("project");
	var fs = testInjector.resolve("fs");

	// Create new project
	var options:any = require("./../lib/options");
	var tempFolder = temp.mkdirSync("template");

	var projectName = "Test";
	options.path = tempFolder;
	options.template = "Blank";
	options.appid = "com.telerik.Test";
	project.createNewProject(projectTypes.Cordova, projectName).wait();

	var availableMarketplacePlugins = [
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

	if (configuration === "debug") {
		options.debug = true;
	} else if(configuration === "release") {
		delete options.debug;
		options.release = true;
	}

	var projectFilePath = path.join(tempFolder, projectName, getProjectFileName(configuration));
	var abProjectContent = fs.readJson(projectFilePath).wait();

	updateTestInjector(testInjector, getCordovaPluginsData(abProjectContent["CorePlugins"]), availableMarketplacePlugins);
	var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
	project.getProperty = (propertyName: string, configuration: string) => {
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
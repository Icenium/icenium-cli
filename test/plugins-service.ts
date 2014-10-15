///<reference path=".d.ts"/>
"use strict";

import yok = require("../lib/common/yok");
import stubs = require("./stubs");
import pluginsService = require("./../lib/services/plugins-service");
import cordovaPluginsService = require("./../lib/services/cordova-plugins");
import marketplacePluginsService = require("./../lib/services/marketplace-plugins-service");
import assert = require("assert");
import Future = require("fibers/future");
import util = require("util");

function doMarketplacePluginsData(marketplacePlugins: string[]) {
	var json = '[';
	var index = 0;
	_.each(marketplacePlugins, plugin => {
		var parts = plugin.split("@");
		var uniqueId = parts[0];
		var version = parts[1];
		var title = _.last(uniqueId.split("."));
		var obj = util.format('{"title": "%s", "uniqueId": "%s", "pluginVersion": "%s","downloadsCount": "24","repositoryUrl": "","demoAppRepositoryLink": ""}',
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

function createTestInjector(cordovaPlugins: string[], installedMarketplacePlugins: string[], availableMarketplacePlugins: string[]) {
	var testInjector = new yok.Yok();
	testInjector.register("cordovaPluginsService",  cordovaPluginsService.CordovaPluginsService);
	testInjector.register("marketplacePluginsService", marketplacePluginsService.MarketplacePluginsService);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("config", {});

	// Register mocked project
	testInjector.register("project", {
		projectData: {
			FrameworkVersion: "",
			CorePlugins: cordovaPlugins.concat(installedMarketplacePlugins)
		},
		ensureProject: () => { },
		saveProject: () => {
			return (() => { }).future<void>()();
		}
	});

	// Register mocked cordovaMigrationService
	testInjector.register("cordovaMigrationService", {
		pluginsForVersion: (verion: string) => {
			return Future.fromResult(cordovaPlugins);
		}
	});

	// Register mocked httpClient
	testInjector.register("httpClient", {
		httpRequest: (): IFuture<any> => {
			return Future.fromResult({
				body: doMarketplacePluginsData(installedMarketplacePlugins.concat(availableMarketplacePlugins))
			});
		}
	});

	return testInjector;
}

describe("plugins-service", () => {
	it("return count of installed plugins", () => {
		var cordovaPlugins = ["org.apache.cordova.battery-status", "com.phonegap.plugins.PushPlugin"];
		var marketplacePlugins = ["com.telerik.stripe@1.0.4"];

	 	var testInjector = createTestInjector(cordovaPlugins, marketplacePlugins, marketplacePlugins);

		var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		var installedPlugins = service.getInstalledPlugins().wait();

		assert.equal(3, installedPlugins.length);
	});
	it("increment installed plugins count after add plugin", () => {
		var cordovaPlugins = ["org.apache.cordova.battery-status", "com.phonegap.plugins.PushPlugin"];
		var installedMarketplacePlugins = ["com.telerik.stripe@1.0.4"];
		var availableMarketplacePlugins = ["nl.x-services.plugins.toast@2.0.1"];

		var testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);

		var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		service.addPlugin("toast").wait();

		assert.equal(4, service.getInstalledPlugins().wait().length);
	});
	it("decrement installed plugins count after remove plugin", () => {
		var cordovaPlugins = ["org.apache.cordova.battery-status", "com.phonegap.plugins.PushPlugin"];
		var installedMarketplacePlugins = ["com.telerik.stripe@1.0.4", "nl.x-services.plugins.toast@2.0.1"];

		var testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, installedMarketplacePlugins);

		var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		service.removePlugin("stripe").wait();

		assert.equal(3, service.getInstalledPlugins().wait().length);
	});
});

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

function createTestInjector(cordovaPlugins: any[], installedMarketplacePlugins: any[], availableMarketplacePlugins: any[]): IInjector {
	var testInjector = new yok.Yok();
	testInjector.register("cordovaPluginsService", cordovaPluginsService.CordovaPluginsService);
	testInjector.register("marketplacePluginsService", marketplacePluginsService.MarketplacePluginsService);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("config", {});
	testInjector.register("prompter", {});

	// Register mocked project
	testInjector.register("project", {
		projectData: {
			Framework: "Cordova",
			FrameworkVersion: "",
			CorePlugins: _.map(cordovaPlugins, p => p.Identifier).concat(_.map(installedMarketplacePlugins, m => util.format("%s@%s", m.Identifier, m.Version)))
		},
		ensureProject: () => { },
		saveProject: () => {
			return (() => { }).future<void>()();
		}
	});

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
				body: createMarketplacePluginsData(installedMarketplacePlugins.concat(availableMarketplacePlugins))
			});
		}
	});

	return testInjector;
}

describe("plugins-service", () => {
	it("return count of installed plugins", () => {
		var cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];
		var marketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4"
		}];

		var testInjector = createTestInjector(cordovaPlugins, marketplacePlugins, marketplacePlugins);

		var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		var installedPlugins = service.getInstalledPlugins();

		assert.equal(3, installedPlugins.length);
	});
	it("increment installed plugins count after add plugin", () => {
		var cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];
		var installedMarketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4" }];
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

		var testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);
		var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		service.addPlugin("toast").wait();

		assert.equal(4, service.getInstalledPlugins().length);
	});
	it("decrement installed plugins count after remove plugin", () => {
		var cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];
		var installedMarketplacePlugins = [
			{
				Identifier: "com.telerik.stripe",
				Name: "Stripe",
				Version: "1.0.4"
			},
			{
				Identifier: "nl.x-services.plugins.toast",
				Name: "Toast",
				Version: "2.0.1"
			}
		];

		var testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, installedMarketplacePlugins);

		var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		service.removePlugin("Stripe").wait();

		assert.equal(3, service.getInstalledPlugins().length);
	});
	it("does not fail if data for one of the plugins cannot be fetched", () => {
		var cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];

		var installedMarketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4"
		}];

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

		var testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);
		var marketPlaceService: ICordovaPluginsService = testInjector.resolve("marketplacePluginsService");
		marketPlaceService.createPluginData = (plugin: any): IFuture<IMarketplacePlugin> => {
			return (() => {
				throw new Error("MockMarketPlace throws error when creating plugin data.");
			}).future<IMarketplacePlugin>()();
		};

		var service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		var availablePlugins = service.getAvailablePlugins();

		// Only cordovaPlugins are counted, availableMarketplacePlugins cannot fetched, but we still receive correct data for other plugins
		assert.equal(2, availablePlugins.length);
	});
});

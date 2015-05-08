///<reference path=".d.ts"/>
"use strict";

import cordovaPluginsService = require("./../lib/services/cordova-plugins");
import helpers = require("../lib/common/helpers");
import marketplacePluginsService = require("./../lib/services/marketplace-plugins-service");
import pluginsService = require("./../lib/services/plugins-service");
import stubs = require("./stubs");
import yok = require("../lib/common/yok");

import assert = require("assert");
import Future = require("fibers/future");
import util = require("util");

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

function createTestInjector(cordovaPlugins: any[], installedMarketplacePlugins: any[], availableMarketplacePlugins: any[]): IInjector {
	let testInjector = new yok.Yok();
	testInjector.register("cordovaPluginsService", cordovaPluginsService.CordovaPluginsService);
	testInjector.register("marketplacePluginsService", marketplacePluginsService.MarketplacePluginsService);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("config", {});
	testInjector.register("prompter", {});
	testInjector.register("projectConstants", {});
	testInjector.register("project", {});

	// Register mocked project
	testInjector.register("project", {
		projectData: {
			FrameworkVersion: "",
			CorePlugins: _.map(cordovaPlugins, p => p.Identifier).concat(_.map(installedMarketplacePlugins, m => util.format("%s@%s", m.Identifier, m.Version))),
			Framework: "Cordova"
		},
		hasBuildConfigurations: () => false,
		getProperty(propertyName:string, configuration: string):any {
			return this.projectData[propertyName];
		},
		setProperty(propertyName:string, value:any, configuration: string): void {
			this.projectData[propertyName] = value;
		},
		saveProject: () => {
			return (() => {
			}).future<void>()();
		},
		ensureProject: () => { },
		ensureCordovaProject: () => {},
		configurations:  ["debug"]
	});

	testInjector.register("server", {
		cordova: {
			getPlugins: () => {
				return Future.fromResult(cordovaPlugins);
			},
			getMarketplacePluginsData: () => {
				return Future.fromResult(availableMarketplacePlugins);
			}
		}
	});

	testInjector.register("loginManager", {
		ensureLoggedIn: (): IFuture<void> => {
			return Future.fromResult();
		}
	});

	return testInjector;
}

describe("plugins-service", () => {
	it("return count of installed plugins", () => {
		let cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];
		let installedMarketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4"
		}];
		let availableMarketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			DefaultVersion: "1.0.4",
			Versions: [{
				Identifier: "com.telerik.stripe",
				Name: "Stripe",
				Version: "1.0.4"
			}]
		}];

		let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);

		let service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		let installedPlugins = service.getInstalledPlugins();

		assert.equal(3, installedPlugins.length);
	});
	it("increment installed plugins count after add plugin", () => {
		let cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];
		let installedMarketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4" }];
		let availableMarketplacePlugins = [
			{
				Identifier: "nl.x-services.plugins.toast",
				DefaultVersion: "2.0.1",
				Versions: [
					{
						Identifier: "nl.x-services.plugins.toast",
						Name: "Toast",
						Version: "2.0.1"
					}
				]
			},
			{
				Identifier: "com.telerik.stripe",
				DefaultVersion: "1.0.4",
				Versions: [
					{
						Identifier: "com.telerik.stripe",
						Name: "Stripe",
						Version: "1.0.4"
					}
				]
			}];

			let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);

			let service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
			service.addPlugin("Toast").wait();
			let installedPlugins = service.getInstalledPlugins();

			assert.equal(4, installedPlugins.length);
		});
	it("decrement installed plugins count after remove plugin", () => {
		let cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];
		let installedMarketplacePlugins = [{
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
		let availableMarketplacePlugins = [
			{
				Identifier: "com.telerik.stripe",
				DefaultVersion: "1.0.4",
				Versions: [{
					Identifier: "com.telerik.stripe",
					Name: "Stripe",
					Version: "1.0.4"
				}]
			},
			{
				Identifier: "nl.x-services.plugins.toast",
				DefaultVersion: "2.0.1",
				Versions: [{
					Identifier: "nl.x-services.plugins.toast",
					Name: "Toast",
					Version: "2.0.1"
				}]
			}
		];

		let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);

		let service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		service.removePlugin("Stripe").wait();

		assert.equal(3, service.getInstalledPlugins().length);
	});
	it("does not fail if data for one of the plugins cannot be fetched", () => {
		let cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			},
			{
				Identifier: "com.phonegap.plugins.PushPlugin",
				Name: "PushPlugin"
			}
		];

		let installedMarketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4"
		}];

		let availableMarketplacePlugins = [
			{
				Identifier: "nl.x-services.plugins.toast",
				DefaultVersion: "2.0.1",
				Versions: [{
					Identifier: "nl.x-services.plugins.toast",
					Name: "Toast",
					Version: "2.0.1"
				}]
			},
			{
				Identifier: "com.telerik.stripe",
				DefaultVersion: "1.0.4",
				Versions: [{
					Identifier: "com.telerik.stripe",
					Name: "Stripe",
					Version: "1.0.4"
				}]
			}
		];

		let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);
		let marketPlaceService: ICordovaPluginsService = testInjector.resolve("marketplacePluginsService");
		marketPlaceService.createPluginData = (plugin: any): IMarketplacePlugin[] => {
			throw new Error("MockMarketPlace throws error when creating plugin data.");
		};

		let service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		let availablePlugins = service.getAvailablePlugins();

		// Only cordovaPlugins are counted, availableMarketplacePlugins cannot fetched, but we still receive correct data for other plugins
		assert.equal(2, availablePlugins.length);
	});
});


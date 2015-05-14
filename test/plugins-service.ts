///<reference path=".d.ts"/>
"use strict";

import cordovaPluginsService = require("./../lib/services/cordova-plugins");
import helpers = require("../lib/common/helpers");
import marketplacePluginsService = require("./../lib/services/marketplace-plugins-service");
import pluginsService = require("./../lib/services/plugins-service");
import stubs = require("./stubs");
import yok = require("../lib/common/yok");

let assert = require("chai").assert;
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
		getProjectDir: () => {
			return Future.fromResult("");
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

class PrompterStub implements IPrompter {
	constructor(public choiceIndex: number, public versionIndex?: number) {}
	get(schema: IPromptSchema[]): IFuture<any> { return Future.fromResult();}
	getPassword(prompt: string, options?: {allowEmpty?: boolean}): IFuture<string> { return Future.fromResult("");}
	getString(prompt: string): IFuture<string> { return Future.fromResult("");}
	promptForChoice(promptMessage: string, choices: any[]): IFuture<string> {
		let selectedChoice = choices[this.choiceIndex];
		
		if(promptMessage.toLowerCase().indexOf("plugin version do you want to use") !== -1) {
			selectedChoice = choices[this.versionIndex];
		}

		if(typeof(selectedChoice) !== "string") {
			selectedChoice = selectedChoice.value;
		}
		
		return Future.fromResult(selectedChoice);
	}
	confirm(prompt: string, defaultAction?: () => boolean): IFuture<boolean>{ return Future.fromResult(true);}
	dispose(): void  {}
}

class ProjectStub {
	constructor(public installedMarketplacePluginsInDebug: any[], public installedMarketplacePluginsInRelease: any[]) { }
	projectData: any = {
		FrameworkVersion: "",
		Framework: "Cordova"
	};
	
	configurationSpecificData: any = {
		"debug":
		{
			CorePlugins: _.map(this.installedMarketplacePluginsInDebug, m => util.format("%s@%s", m.Identifier, m.Version)),
		},
		"release":
		{
			CorePlugins: _.map(this.installedMarketplacePluginsInRelease, m => util.format("%s@%s", m.Identifier, m.Version)),
		}
	};
	
	hasBuildConfigurations = () => true;
	
	getProperty(propertyName:string, configuration: string): any {
		return this.projectData[propertyName] || this.configurationSpecificData[configuration][propertyName];
	}
	
	setProperty(propertyName:string, value:any, configuration: string): void {
		if(propertyName === "CorePlugins" && configuration) {
			this.configurationSpecificData[configuration][propertyName] = value;
		} else {
			this.projectData[propertyName] = value;
		}
	}
	
	saveProject = () => {
		return (() => {
		}).future<void>()();
	}
	
	getProjectDir = () => {
		return Future.fromResult("");
	}
	
	ensureProject = () => { }
	ensureCordovaProject = () => {}
	get configurations(): string[] {
		let configs: string[] = [];
		let options = require("../lib/common/options");
		if(options.debug) {
			configs.push("debug");
		}
		
		if(options.release) {
			configs.push("release");
		}
		
		if (!options.debug && !options.release) {
			configs = ["debug", "release"];
		}
		
		return configs;
	}
}

function createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug: any[], installedMarketplacePluginsInRelease: any[], isInteractive: boolean, projectConfiguration?: string): IInjector {
	let testInjector = new yok.Yok();
	let helpers = require("../lib/common/helpers");
	helpers.isInteractive = () => { return isInteractive; }
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
			},
			{
				Identifier: "nl.x-services.plugins.toast",
				Name: "Toast",
				Version: "2.0.4"
			},
			{
				Identifier: "nl.x-services.plugins.toast",
				Name: "Toast",
				Version: "2.0.5"
			}]
		}
	];

	testInjector.register("cordovaPluginsService", cordovaPluginsService.CordovaPluginsService);
	testInjector.register("marketplacePluginsService", marketplacePluginsService.MarketplacePluginsService);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("config", {});
	
	testInjector.register("projectConstants", {
		DEBUG_CONFIGURATION_NAME: "debug",
		RELEASE_CONFIGURATION_NAME: "release"
	});

	// Register mocked project
	testInjector.register("project", new ProjectStub(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease));

	testInjector.register("server", {
		cordova: {
			getPlugins: () => {
				return Future.fromResult([]);
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
	it("throw if installed plugin is not available", () => {
		let installedMarketplacePlugins = [{
				Identifier: "com.telerik.Invalid",
				Name: "Stripe",
				Version: "1.0.4"
			}
		];

		let testInjector = createTestInjector([], installedMarketplacePlugins, []);

		let service: IPluginsService = testInjector.resolve(pluginsService.PluginsService);
		assert.throws(() => service.getInstalledPlugins());
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

	describe("adding marketplace plugin works correctly",() => {
		let service: IPluginsService,
			options = require("../lib/common/options"),
			versionToSet = "2.0.5",
			testInjector: IInjector;
		let getToastPlugin = (version: string, configuration?: string) => {
			let configs: string[] = configuration ? [configuration] : ["debug", "release"];
			return {
				Identifier: "nl.x-services.plugins.toast",
				Name: "Toast",
				configurations: configs,
				Version: version
			};
		}

		describe("modifies marketplace plugin version in both configurations when different versions are used",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")],
				installedMarketplacePluginsInRelease = [getToastPlugin("2.0.4", "release")];
			
			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(pluginsService.PluginsService);

				options.debug = options.release = false;
				service.addPlugin(`Toast@${versionToSet}`).wait();

				options.debug = true;
				options.release = false;
				let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
				assert.equal(toastInDebugConfig.length, 1);
				assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);

				options.debug = false;
				options.release = true;
				let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
				assert.equal(toastInReleaseConfig.length, 1);
				assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);
			});

			it("when console is interactive",() => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, true);
			});

			it("when console is not interactive",() => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, false);
			});
		});

		it("modifies marketplace plugin version in both configurations when it is enabled in one only and user selects to update both configs",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true, "release");
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);
			options.debug = false;
			options.release = true;
			service.addPlugin(`Toast@${versionToSet}`).wait();
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInReleaseConfig.length, 1);
			assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);

			options.debug = true;
			options.release = false;
			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInDebugConfig.length, 1);
			assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);
		});

		it("removes marketplace plugin from one config and adds it to specified one when user selects this action",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true, "release");
			testInjector.register("prompter", new PrompterStub(0));
			service = testInjector.resolve(pluginsService.PluginsService);
			options.debug = false;
			options.release = true;
			service.addPlugin(`Toast@${versionToSet}`).wait();

			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(),(pl: IPlugin) => pl.data.Name.toLowerCase() === "toast");
			assert.equal(1, toastInReleaseConfig.length, "Plugin toast MUST be enabled in release configuration.");
			assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);

			options.debug = true;
			options.release = false;
			let toastInDebugConfig = _.filter(service.getInstalledPlugins(),(pl: IPlugin) => pl.data.Name.toLowerCase() === "toast");
			assert.equal(0, toastInDebugConfig.length, "Plugin toast should not be enabled in debug configuration.");
		});

		describe("modifies only version of the plugin when it is enabled in one config and user wants to modify this config only",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			let testInjector: IInjector;
			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(pluginsService.PluginsService);

				options.debug = true;
				options.release = false;
				service.addPlugin(`Toast@${versionToSet}`).wait();

				let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
				assert.equal(toastInDebugConfig.length, 1);
				assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);

				options.debug = false;
				options.release = true;
				let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
				assert.equal(toastInReleaseConfig.length, 0);
			});

			it("when console is interactive",() => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
			});

			it("when console is not interactive",() => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], false);
			});
		});

		describe("updates plugin version when it is enabled in at least one config and user tries to add it to both configs",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			let testInjector: IInjector;
			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(pluginsService.PluginsService);

				options.debug = false;
				options.release = false;
				service.addPlugin(`Toast@${versionToSet}`).wait();

				let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
				assert.equal(toastInDebugConfig.length, 1);
				assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);

				options.debug = false;
				options.release = true;
				let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
				assert.equal(toastInReleaseConfig.length, 1);
				assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);
			});

			describe("when console is interactive",() => {
				it("when plugin is enabled in one config only",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
				});

				it("when plugin is enabled in both configs with same version",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInDebug, true);
				});
			});

			describe("when console is not interactive",() => {
				it("when plugin is enabled in one config only",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], false);
				});

				it("when plugin is enabled in both configs with same version",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInDebug, false);
				});
			});
		});

		it("updates plugin version when it is enabled in both configs and user tries to add it to both configs",() => {
			let installedMarketplacePlugins = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, true);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);

			options.debug = false;
			options.release = false;
			service.addPlugin(`Toast@${versionToSet}`).wait();

			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInDebugConfig.length, 1);
			assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);

			options.debug = false;
			options.release = true;
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInReleaseConfig.length, 1);
			assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);
		});

		it("updates plugin version in both configs when plugin is enabled in both configs and user tries to add it to one config only",() => {
			let installedMarketplacePlugins = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, true);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);

			options.debug = true;
			options.release = false;
			service.addPlugin(`Toast@${versionToSet}`).wait();

			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInDebugConfig.length, 1);
			assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);

			options.debug = false;
			options.release = true;
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInReleaseConfig.length, 1);
			assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);
		});

		it("throws error when plugin is enabled in both configs and user tries to add it to one config only in non interactive terminal",() => {
			let installedMarketplacePlugins = [getToastPlugin("2.0.1")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);

			options.debug = true;
			options.release = false;
			assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
		});

		it("throws error when plugin is enabled in one config and user wants to update the other one in non-interactive terminal",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];

			let installedMarketplacePluginsInRelease: any[] = [];

			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);
			options.debug = false;
			options.release = true;
			let versionToSet = "2.0.5";
			assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
		});

		it("updates plugin version in both configs when plugin is enabled in both configs with different versions and user tries to add it to one config only",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")],
				installedMarketplacePluginsInRelease = [getToastPlugin("2.0.4", "release")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, true);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);

			options.debug = true;
			options.release = false;
			service.addPlugin(`Toast@${versionToSet}`).wait();

			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInDebugConfig.length, 1);
			assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);

			options.debug = false;
			options.release = true;
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInReleaseConfig.length, 1);
			assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);
		});

		it("throws error when plugin is enabled in both configs with different versions and user tries to add it to one config only",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")],
				installedMarketplacePluginsInRelease = [getToastPlugin("2.0.4", "release")];
			let testInjector: IInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);

			options.debug = true;
			options.release = false;
			assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
		});

		it("throws error when console is non-interactive and user had not specified version for plugin",() => {
			testInjector = createTestInjectorForProjectWithBothConfigurations([], [], false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(pluginsService.PluginsService);
			options.debug = false;
			options.release = true;
			assert.throws(() => service.addPlugin("Toast").wait());
		});

		describe("throws error when specified version is not valid",() => {
			let versionToSet = "2.0.8";
			let installedMarketplacePlugins = [getToastPlugin("2.0.1", "debug")];
			let testInjector: IInjector;
			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(pluginsService.PluginsService);

				options.debug = options.release = false;
				assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
			});
			describe("when plugin is not installed at all",() => {
				it("when console is interactive",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations([], [], true);
				});

				it("when console is not interactive",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations([], [], false);
				});
			});

			describe("when plugin is installed in one config only",() => {
				it("when console is interactive",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, [], true);
				});

				it("when console is not interactive",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, [], false);
				});
			});

			describe("when plugin is installed in all configs",() => {
				it("when console is interactive",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, true);
				});

				it("when console is not interactive",() => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, false);
				});
			});
		});
		
		describe("when version is not specified", () => {
			describe("prompts for version", () => {
				describe("when plugin is enabled in all configs with same version", () => {
					let selectedVersionFromPrompt = "2.0.1";
					let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.4")],
							installedMarketplacePluginsInRelease = [getToastPlugin("2.0.4")];
					beforeEach(() => {
						testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, true);
						testInjector.register("prompter", new PrompterStub(1, 0)); // 0 is for version 2.0.1
						service = testInjector.resolve(pluginsService.PluginsService);
					});
					
					afterEach(() => {
						service.addPlugin("Toast").wait();
						
						options.debug = true;
						options.release = false;
						let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInDebugConfig.length, 1);
						assert.deepEqual(_.first(toastInDebugConfig).data.Version, selectedVersionFromPrompt);
			
						options.debug = false;
						options.release = true;
						let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInReleaseConfig.length, 1);
						assert.deepEqual(_.first(toastInReleaseConfig).data.Version, selectedVersionFromPrompt);
					});
					
					it("when user specifies one configuration only and selects to enable it in both configurations from the prompter", ()=> {
						options.debug = true;
						options.release = false;
						
					});
					it("when user does not specify configuration", ()=> {
						options.debug= options.release = false;
					});
				});
				
				describe("when plugin is enabled in one config", () => {
					let selectedVersionFromPrompt = "2.0.1";
					let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.4")];
					beforeEach(() => {
						testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
						testInjector.register("prompter", new PrompterStub(1, 0)); // 0 is for version 2.0.1
						service = testInjector.resolve(pluginsService.PluginsService);
					});
					
					it("when user wants to update same configuration only", ()=> {
						options.debug = true;
						options.release = false;
						service.addPlugin("Toast").wait();
						
						let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInDebugConfig.length, 1);
						assert.deepEqual(_.first(toastInDebugConfig).data.Version, selectedVersionFromPrompt);
			
						options.debug = false;
						options.release = true;
						let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInReleaseConfig.length, 0);
					});
					
					it("when user does not specify configuration and selects to update both config from first prompt", ()=> {
						options.debug = options.release = false;
						service.addPlugin("Toast").wait();

						options.debug = true;
						options.release = false;
						let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInDebugConfig.length, 1);
						assert.deepEqual(_.first(toastInDebugConfig).data.Version, selectedVersionFromPrompt);
			
						options.debug = false;
						options.release = true;
						let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInReleaseConfig.length, 1);
						assert.deepEqual(_.first(toastInReleaseConfig).data.Version, selectedVersionFromPrompt);
					});
					
					it("when user wants to update the other configuration, but selects to update both configs from first prompt", ()=> {
						options.debug = false;
						options.release = true;
						service.addPlugin("Toast").wait();
						
						let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInReleaseConfig.length, 1);
						assert.deepEqual(_.first(toastInReleaseConfig).data.Version, selectedVersionFromPrompt);
						
						options.debug = true;
						options.release = false;
						let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInDebugConfig.length, 1);
						assert.deepEqual(_.first(toastInDebugConfig).data.Version, selectedVersionFromPrompt);
					});
				});
				
				describe("when plugin is enabled in all configs with different version", () => {
					let selectedVersionFromPrompt = "2.0.1";
					let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.4")],
							installedMarketplacePluginsInRelease = [getToastPlugin("2.0.5")];
					beforeEach(() => {
						testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, true);
						testInjector.register("prompter", new PrompterStub(1, 0)); // 0 is for version 2.0.1
						service = testInjector.resolve(pluginsService.PluginsService);
					});
					
					afterEach(() => {
						service.addPlugin("Toast").wait();
						
						options.debug = true;
						options.release = false;
						let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInDebugConfig.length, 1);
						assert.deepEqual(_.first(toastInDebugConfig).data.Version, selectedVersionFromPrompt);
			
						options.debug = false;
						options.release = true;
						let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
						assert.equal(toastInReleaseConfig.length, 1);
						assert.deepEqual(_.first(toastInReleaseConfig).data.Version, selectedVersionFromPrompt);
					});
					
					it("when user specifies one configuration only and selects to enable it in both configurations from the prompter", ()=> {
						options.debug = true;
						options.release = false;
						
					});
					it("when user does not specify configuration", ()=> {
						options.debug= options.release = false;
					});
				});
			});
		});

		it("does not modify anything and cancels operation when user selects to keep current configurations",() => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			let testInjector: IInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
			testInjector.register("prompter", new PrompterStub(2));
			service = testInjector.resolve(pluginsService.PluginsService);

			options.debug = false;
			options.release = true;
			assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
		});
	});
});


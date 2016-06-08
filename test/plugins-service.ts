import {CordovaPluginsService} from "./../lib/services/plugins/cordova-plugins";
import {MarketplacePluginsService} from "./../lib/services/plugins/marketplace-plugins-service";
import {CordovaProjectPluginsService} from "./../lib/services/plugins/cordova-project-plugins-service";
import * as stubs from "./stubs";
import {Yok} from "../lib/common/yok";
import {Options} from "../lib/options";
import {HostInfo} from "../lib/common/host-info";
import {StaticConfig} from "../lib/config";
import {ResourceLoader} from "../lib/common/resource-loader";
import {assert} from "chai";
import Future = require("fibers/future");
import * as plugman from "plugman";

function createTestInjector(cordovaPlugins: any[], installedMarketplacePlugins: any[], availableMarketplacePlugins: any[]): IInjector {
	let testInjector = new Yok();
	testInjector.register("cordovaPluginsService", CordovaPluginsService);
	testInjector.register("marketplacePluginsService", MarketplacePluginsService);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("config", {});
	testInjector.register("prompter", {});
	testInjector.register("projectConstants", {});

	// Register mocked project
	testInjector.register("project", {
		projectData: {
			FrameworkVersion: "3.5.0",
			CorePlugins: _.map(cordovaPlugins, p => p.Identifier).concat(_.map(installedMarketplacePlugins, m => `${m.Identifier}@${m.Version}`)),
			Framework: "Cordova"
		},
		hasBuildConfigurations: () => false,
		getProperty(propertyName: string, configuration: string): any {
			return this.projectData[propertyName];
		},
		setProperty(propertyName: string, value: any, configuration: string): void {
			this.projectData[propertyName] = value;
		},
		saveProject: () => Future.fromResult(),
		getProjectDir: () => Future.fromResult(""),
		ensureProject: () => { /*mock*/ },
		ensureCordovaProject: () => {/*mock*/ },
		configurations: ["debug"]
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

	testInjector.register("hostInfo", HostInfo);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("options", Options);
	testInjector.register("resources", ResourceLoader);
	testInjector.register("childProcess", {});

	return testInjector;
}

class PrompterStub implements IPrompter {
	constructor(public choiceIndex: number, public versionIndex?: number, public pluginVariableResult?: any) { }
	get(schema: IPromptSchema[]): IFuture<any> { return Future.fromResult(this.pluginVariableResult); }
	getPassword(prompt: string, options?: { allowEmpty?: boolean }): IFuture<string> { return Future.fromResult(""); }
	getString(prompt: string): IFuture<string> { return Future.fromResult(""); }
	promptForChoice(promptMessage: string, choices: any[]): IFuture<string> {
		let selectedChoice = choices[this.choiceIndex];

		if (promptMessage.toLowerCase().indexOf("plugin version do you want to use") !== -1) {
			selectedChoice = choices[this.versionIndex];
		}

		if (typeof (selectedChoice) !== "string") {
			selectedChoice = selectedChoice.value;
		}

		return Future.fromResult(selectedChoice);
	}
	confirm(prompt: string, defaultAction?: () => boolean): IFuture<boolean> { return Future.fromResult(true); }
	dispose(): void {/*mock*/ }
}

class ProjectStub {
	constructor(public installedMarketplacePluginsInDebug: any[], public installedMarketplacePluginsInRelease: any[], private testInjector: IInjector) { }
	projectData: any = {
		FrameworkVersion: "3.5.0",
		Framework: "Cordova"
	};

	configurationSpecificData: any = {
		"debug":
		{
			CorePlugins: _.map(this.installedMarketplacePluginsInDebug, m => `${m.Identifier}@${m.Version}`),
		},
		"release":
		{
			CorePlugins: _.map(this.installedMarketplacePluginsInRelease, m => `${m.Identifier}@${m.Version}`),
		}
	};

	hasBuildConfigurations = () => true;

	getProperty(propertyName: string, configuration: string): any {
		return this.projectData[propertyName] || this.configurationSpecificData[configuration][propertyName];
	}

	setProperty(propertyName: string, value: any, configuration: string): void {
		if ((propertyName === "CorePlugins" || propertyName === "CordovaPluginVariables") && configuration) {
			this.configurationSpecificData[configuration][propertyName] = value;
		} else {
			this.projectData[propertyName] = value;
		}
	}

	saveProject = () => Future.fromResult();

	getProjectDir = () => Future.fromResult("");

	ensureProject = () => {/*mock*/ };
	ensureCordovaProject = () => {/*mock*/ };
	get configurations(): string[] {
		let configs: string[] = [];
		let options = this.testInjector.resolve("options");
		if (options.debug) {
			configs.push("debug");
		}

		if (options.release) {
			configs.push("release");
		}

		if (!options.debug && !options.release) {
			configs = ["debug", "release"];
		}

		return configs;
	}
}

function createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug: any[], installedMarketplacePluginsInRelease: any[], isInteractive: boolean, projectConfiguration?: string): IInjector {
	let testInjector = new Yok();
	let helpers = require("../lib/common/helpers");
	helpers.isInteractive = () => { return isInteractive; };
	let availableMarketplacePlugins = [
		{
			Identifier: "com.telerik.stripe",
			DefaultVersion: "1.0.4",
			Versions: [{
				Identifier: "com.telerik.stripe",
				Name: "Stripe",
				Version: "1.0.4",
				SupportedVersion: ">=3.5.0"
			}]
		},
		{
			Identifier: "nl.x-services.plugins.toast",
			DefaultVersion: "2.0.1",
			Versions: [{
				Identifier: "nl.x-services.plugins.toast",
				Name: "Toast",
				Version: "2.0.1",
				SupportedVersion: ">=3.5.0"
			},
				{
					Identifier: "nl.x-services.plugins.toast",
					Name: "Toast",
					Version: "2.0.4",
					SupportedVersion: ">=3.5.0"
				},
				{
					Identifier: "nl.x-services.plugins.toast",
					Name: "Toast",
					Version: "2.0.5",
					SupportedVersion: ">=3.5.0"
				}]
		}
	];

	testInjector.register("cordovaPluginsService", CordovaPluginsService);
	testInjector.register("marketplacePluginsService", MarketplacePluginsService);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("childProcess", {});
	testInjector.register("config", {});

	testInjector.register("projectConstants", {
		DEBUG_CONFIGURATION_NAME: "debug",
		RELEASE_CONFIGURATION_NAME: "release"
	});

	// Register mocked project
	testInjector.register("project", new ProjectStub(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, testInjector));

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

	testInjector.register("options", Options);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("resources", ResourceLoader);

	return testInjector;
}

function createTestInjectorForAvailableMarketplacePlugins(availableMarketplacePlugins: any[], pluginVariableResult?: any): IInjector {
	let testInjector = new Yok();
	let helpers = require("../lib/common/helpers");
	helpers.isInteractive = () => { return true; };

	testInjector.register("cordovaPluginsService", CordovaPluginsService);
	testInjector.register("marketplacePluginsService", MarketplacePluginsService);
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("fs", stubs.FileSystemStub);
	testInjector.register("childProcess", {});
	testInjector.register("config", {});

	testInjector.register("projectConstants", {
		DEBUG_CONFIGURATION_NAME: "debug",
		RELEASE_CONFIGURATION_NAME: "release"
	});

	// Register mocked project
	testInjector.register("project", new ProjectStub([], [], testInjector));

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

	testInjector.register("options", Options);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("hostInfo", HostInfo);
	testInjector.register("resources", ResourceLoader);
	testInjector.register("prompter", new PrompterStub(2, 0, pluginVariableResult));
	return testInjector;
}

describe("plugins-service", () => {
	afterEach(() => {
		// reset options.debug and options.release
		let testInjector = createTestInjectorForAvailableMarketplacePlugins([]);
		let options = testInjector.resolve("options");
		options.release = options.debug = false;
	});
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
				Version: "1.0.4",
				SupportedVersion: ">=3.5.0"
			}]
		}];

		let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);

		let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
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
			Version: "1.0.4"
		}];
		let availableMarketplacePlugins = [
			{
				Identifier: "nl.x-services.plugins.toast",
				DefaultVersion: "2.0.1",
				Versions: [
					{
						Identifier: "nl.x-services.plugins.toast",
						Name: "Toast",
						Version: "2.0.1",
						SupportedVersion: ">=3.5.0"
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
						Version: "1.0.4",
						SupportedVersion: ">=3.5.0"
					}
				]
			}];

		let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);

		let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
		service.addPlugin("Toast").wait();
		let installedPlugins = service.getInstalledPlugins();

		assert.equal(4, installedPlugins.length);
	});

	it("fetches plugin when it is found from plugman", () => {
		let cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			}
		];

		let testInjector = createTestInjector(cordovaPlugins, [], []);

		let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
		let fs: IFileSystem = testInjector.resolve("fs");
		fs.exists = (path: string) => Future.fromResult(false);
		let originalPlugmanFetch = plugman.fetch;
		let originalPlugmanSearch = plugman.search;
		plugman.search = (keywords: string[], callback: (error: Error, result: any) => void) => {
			let result = { 'org.apache.cordova.battery-status': { someData: "data" } };
			callback(null, result);
		};
		plugman.fetch = (plugin_dir: string, plugins_dir: string, link: boolean, subdir: string, git_ref: string, callback: (error: Error, result: any) => void) => {
			callback(null, "Success");
		};

		service.fetch("org.apache.cordova.battery-status").wait();
		plugman.fetch = originalPlugmanFetch;
		plugman.search = originalPlugmanSearch;
		let logger: stubs.LoggerStub = testInjector.resolve("logger");
		assert.isTrue(logger.output.indexOf("Success") !== -1, "Success word should be in the output when plugman fetch succeeds.");
	});

	it("fetches plugin from url when plugman fails fetching by id", () => {
		let cordovaPlugins = [
			{
				Identifier: "org.apache.cordova.battery-status",
				Name: "BatteryStatus"
			}
		];
		let availableMarketplacePlugins = [{
			"Identifier": "com.telerik.dropbox",
			"DefaultVersion": "1.0.2",
			"Framework": "cordova",
			"Versions": [
				{
					"Publisher": {
						"Name": "Telerik plugins",
						"Url": "http://www.telerik.com/"
					},
					"Authors": [
						"Telerik"
					],
					"SupportedVersion": ">=3.5.0",
					"Name": "Dropbox",
					"Identifier": "com.telerik.dropbox",
					"Version": "1.0.2",
					"Description": "Cordova Sync SDK",
					"Url": "https://github.com/Telerik-Verified-Plugins/Dropbox",
					"Platforms": [
						"Android",
						"iOS"
					],
					"Variables": [
						"APP_KEY",
						"APP_SECRET"
					]
				}
			]
		}];
		let testInjector = createTestInjector(cordovaPlugins, [], availableMarketplacePlugins);
		let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
		let fs: IFileSystem = testInjector.resolve("fs");
		fs.exists = (path: string) => Future.fromResult(false);
		let originalPlugmanFetch = plugman.fetch;
		let originalPlugmanSearch = plugman.search;
		plugman.search = (keywords: string[], callback: (error: Error, result: any) => void) => {
			let result = { 'org.apache.cordova.battery-status': { someData: "data" } };
			callback(null, result);
		};
		plugman.fetch = (plugId: string, plugins_dir: string, link: boolean, subdir: string, git_ref: string, callback: (error: Error, result: any) => void) => {
			if (_.startsWith(plugId, "http")) {
				callback(null, "Success");
			} else {
				callback(new Error("Error"), null);
			}

		};
		service.fetch("com.telerik.dropbox").wait();
		plugman.fetch = originalPlugmanFetch;
		plugman.search = originalPlugmanSearch;
		let logger: stubs.LoggerStub = testInjector.resolve("logger");
		assert.isTrue(logger.output.indexOf("Success") !== -1, "Success word should be in the output when plugman fetch succeeds.");
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
			Version: "1.0.4",
			SupportedVersion: ">=3.5.0"
		},
			{
				Identifier: "nl.x-services.plugins.toast",
				Name: "Toast",
				Version: "2.0.1",
				SupportedVersion: ">=3.5.0"
			}
		];
		let availableMarketplacePlugins = [
			{
				Identifier: "com.telerik.stripe",
				DefaultVersion: "1.0.4",
				Versions: [{
					Identifier: "com.telerik.stripe",
					Name: "Stripe",
					Version: "1.0.4",
					SupportedVersion: ">=3.5.0"
				}]
			},
			{
				Identifier: "nl.x-services.plugins.toast",
				DefaultVersion: "2.0.1",
				Versions: [{
					Identifier: "nl.x-services.plugins.toast",
					Name: "Toast",
					Version: "2.0.1",
					SupportedVersion: ">=3.5.0"
				}]
			}
		];

		let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);

		let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
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

		let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
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
					Version: "2.0.1",
					SupportedVersion: ">=3.5.0"
				}]
			},
			{
				Identifier: "com.telerik.stripe",
				DefaultVersion: "1.0.4",
				Versions: [{
					Identifier: "com.telerik.stripe",
					Name: "Stripe",
					Version: "1.0.4",
					SupportedVersion: ">=3.5.0"
				}]
			}
		];

		let testInjector = createTestInjector(cordovaPlugins, installedMarketplacePlugins, availableMarketplacePlugins);
		let marketPlaceService: ICordovaPluginsService = testInjector.resolve("marketplacePluginsService");
		marketPlaceService.createPluginData = (plugin: any): IMarketplacePlugin[] => {
			throw new Error("MockMarketPlace throws error when creating plugin data.");
		};

		let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
		let availablePlugins = service.getAvailablePlugins();

		// Only cordovaPlugins are counted, availableMarketplacePlugins cannot fetched, but we still receive correct data for other plugins
		// assert.equal(2, availablePlugins.length);
		// HACK - when LivePatch plugin is working correctly, remove the line below and use the assert above.
		assert.equal(3, availablePlugins.length);
	});
	describe("isPluginInstalled returns correct results", () => {
		let installedMarketplacePlugins = [{
			Identifier: "com.telerik.stripe",
			Name: "Stripe",
			Version: "1.0.4"
		}
		];
		let availableMarketplacePlugins = [
			{
				Identifier: "com.telerik.stripe",
				DefaultVersion: "1.0.4",
				Versions: [{
					Identifier: "com.telerik.stripe",
					Name: "Stripe",
					Version: "1.0.4",
					SupportedVersion: ">=3.5.0"
				}]
			}
		];

		it("isPluginInstalled returns true when plugin is installed and plugin name is passed", () => {
			let testInjector = createTestInjector([], installedMarketplacePlugins, availableMarketplacePlugins);
			let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
			assert.isTrue(service.isPluginInstalled("stripe"));
		});

		it("isPluginInstalled returns true when plugin is installed and plugin identifier is passed", () => {
			let testInjector = createTestInjector([], installedMarketplacePlugins, availableMarketplacePlugins);
			let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
			assert.isTrue(service.isPluginInstalled("com.telerik.stripe"));
		});

		it("isPluginInstalled returns false when plugin is not installed and plugin name is passed", () => {
			let testInjector = createTestInjector([], [], availableMarketplacePlugins);
			let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
			assert.isFalse(service.isPluginInstalled("stripe"));
		});

		it("isPluginInstalled returns false when plugin is not installed and plugin identifier is passed", () => {
			let testInjector = createTestInjector([], [], availableMarketplacePlugins);
			let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
			assert.isFalse(service.isPluginInstalled("com.telerik.stripe"));
		});
	});
	describe("adding marketplace plugin works correctly", () => {
		let service: IPluginsService,
			versionToSet = "2.0.5",
			testInjector: IInjector,
			options: IOptions;
		let getToastPlugin = (version: string, configuration?: string) => {
			let configs: string[] = configuration ? [configuration] : ["debug", "release"];
			return {
				Identifier: "nl.x-services.plugins.toast",
				Name: "Toast",
				configurations: configs,
				Version: version
			};
		};

		describe("modifies marketplace plugin version in both configurations when different versions are used", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")],
				installedMarketplacePluginsInRelease = [getToastPlugin("2.0.4", "release")];

			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(CordovaProjectPluginsService);

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

			it("when console is interactive", () => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, true);
			});

			it("when console is not interactive", () => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, false);
			});
		});

		it("modifies marketplace plugin version in both configurations when it is enabled in one only and user selects to update both configs", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true, "release");
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");
			options.debug = false;
			options.release = true;

			service.addPlugin(`Toast@${versionToSet}`).wait();
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInReleaseConfig.length, 1);
			assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);

			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Name.toLowerCase() === "toast");
			assert.equal(toastInDebugConfig.length, 1);
			assert.deepEqual(_.first(toastInDebugConfig).data.Version, versionToSet);
		});

		it("removes marketplace plugin from one config and adds it to specified one when user selects this action", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true, "release");
			testInjector.register("prompter", new PrompterStub(0));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");
			options.debug = false;
			options.release = true;
			service.addPlugin(`Toast@${versionToSet}`).wait();

			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), (pl: IPlugin) => pl.data.Name.toLowerCase() === "toast");
			assert.equal(1, toastInReleaseConfig.length, "Plugin toast MUST be enabled in release configuration.");
			assert.deepEqual(_.first(toastInReleaseConfig).data.Version, versionToSet);

			options.debug = true;
			options.release = false;
			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), (pl: IPlugin) => pl.data.Name.toLowerCase() === "toast");
			assert.equal(0, toastInDebugConfig.length, "Plugin toast should not be enabled in debug configuration.");
		});

		describe("modifies only version of the plugin when it is enabled in one config and user wants to modify this config only", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(CordovaProjectPluginsService);
				options = testInjector.resolve("options");

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

			it("when console is interactive", () => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
			});

			it("when console is not interactive", () => {
				testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], false);
			});
		});

		describe("updates plugin version when it is enabled in at least one config and user tries to add it to both configs", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(CordovaProjectPluginsService);
				options = testInjector.resolve("options");

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

			describe("when console is interactive", () => {
				it("when plugin is enabled in one config only", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
				});

				it("when plugin is enabled in both configs with same version", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInDebug, true);
				});
			});

			describe("when console is not interactive", () => {
				it("when plugin is enabled in one config only", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], false);
				});

				it("when plugin is enabled in both configs with same version", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInDebug, false);
				});
			});
		});

		it("updates plugin version when it is enabled in both configs and user tries to add it to both configs", () => {
			let installedMarketplacePlugins = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, true);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");

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

		it("updates plugin version in both configs when plugin is enabled in both configs and user tries to add it to one config only", () => {
			let installedMarketplacePlugins = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, true);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");

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

		it("throws error when plugin is enabled in both configs and user tries to add it to one config only in non interactive terminal", () => {
			let installedMarketplacePlugins = [getToastPlugin("2.0.1")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");

			options.debug = true;
			options.release = false;
			assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
		});

		it("throws error when plugin is enabled in one config and user wants to update the other one in non-interactive terminal", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			let installedMarketplacePluginsInRelease: any[] = [];

			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");
			options.debug = false;
			options.release = true;
			assert.throws(() => service.addPlugin("Toast@2.0.5").wait());
		});

		it("updates plugin version in both configs when plugin is enabled in both configs with different versions and user tries to add it to one config only", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")],
				installedMarketplacePluginsInRelease = [getToastPlugin("2.0.4", "release")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, true);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");

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

		it("throws error when plugin is enabled in both configs with different versions and user tries to add it to one config only", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")],
				installedMarketplacePluginsInRelease = [getToastPlugin("2.0.4", "release")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, installedMarketplacePluginsInRelease, false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");

			options.debug = true;
			options.release = false;
			assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
		});

		it("throws error when console is non-interactive and user had not specified version for plugin", () => {
			testInjector = createTestInjectorForProjectWithBothConfigurations([], [], false);
			testInjector.register("prompter", new PrompterStub(1));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");
			options.debug = false;
			options.release = true;
			assert.throws(() => service.addPlugin("Toast").wait());
		});

		describe("throws error when specified version is not valid", () => {
			let invalidVersionToSet = "2.0.8";
			let installedMarketplacePlugins = [getToastPlugin("2.0.1", "debug")];
			afterEach(() => {
				testInjector.register("prompter", new PrompterStub(1));
				service = testInjector.resolve(CordovaProjectPluginsService);
				options = testInjector.resolve("options");

				options.debug = options.release = false;
				assert.throws(() => service.addPlugin(`Toast@${invalidVersionToSet}`).wait());
			});
			describe("when plugin is not installed at all", () => {
				it("when console is interactive", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations([], [], true);
				});

				it("when console is not interactive", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations([], [], false);
				});
			});

			describe("when plugin is installed in one config only", () => {
				it("when console is interactive", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, [], true);
				});

				it("when console is not interactive", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, [], false);
				});
			});

			describe("when plugin is installed in all configs", () => {
				it("when console is interactive", () => {
					testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePlugins, installedMarketplacePlugins, true);
				});

				it("when console is not interactive", () => {
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
						service = testInjector.resolve(CordovaProjectPluginsService);
						options = testInjector.resolve("options");
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

					it("when user specifies one configuration only and selects to enable it in both configurations from the prompter", () => {
						options.debug = true;
						options.release = false;

					});
					it("when user does not specify configuration", () => {
						options.debug = options.release = false;
					});
				});

				describe("when plugin is enabled in one config", () => {
					let selectedVersionFromPrompt = "2.0.1";
					let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.4")];
					beforeEach(() => {
						testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
						testInjector.register("prompter", new PrompterStub(1, 0)); // 0 is for version 2.0.1
						service = testInjector.resolve(CordovaProjectPluginsService);
						options = testInjector.resolve("options");
					});

					it("when user wants to update same configuration only", () => {
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

					it("when user does not specify configuration and selects to update both config from first prompt", () => {
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

					it("when user wants to update the other configuration, but selects to update both configs from first prompt", () => {
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
						service = testInjector.resolve(CordovaProjectPluginsService);
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

					it("when user specifies one configuration only and selects to enable it in both configurations from the prompter", () => {
						options.debug = true;
						options.release = false;

					});
					it("when user does not specify configuration", () => {
						options.debug = options.release = false;
					});
				});
			});
		});

		it("does not modify anything and cancels operation when user selects to keep current configurations", () => {
			let installedMarketplacePluginsInDebug = [getToastPlugin("2.0.1", "debug")];
			testInjector = createTestInjectorForProjectWithBothConfigurations(installedMarketplacePluginsInDebug, [], true);
			testInjector.register("prompter", new PrompterStub(2));
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");
			options.debug = false;
			options.release = true;
			assert.throws(() => service.addPlugin(`Toast@${versionToSet}`).wait());
		});
	});

	describe("com.telerik.LivePatch", () => {
		let livePatchId = "com.telerik.LivePatch";
		let testInjector: IInjector,
			options: IOptions,
			service: IPluginsService;
		beforeEach(() => {
			testInjector = createTestInjectorForProjectWithBothConfigurations([], [], true);
			testInjector.register("prompter", new PrompterStub(1, 0)); // 0 is for version 2.0.1
			service = testInjector.resolve(CordovaProjectPluginsService);
			options = testInjector.resolve("options");
			options.debug = false;
			options.release = false;
		});

		it("is added to release config by default", () => {
			service.addPlugin(livePatchId).wait();
			options.debug = false;
			options.release = true;
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInReleaseConfig.length, 1);
			options.debug = true;
			options.release = false;
			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInDebugConfig.length, 0);
		});

		it("is added to release config when it is specified", () => {
			options.debug = false;
			options.release = true;
			service.addPlugin(livePatchId).wait();
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInReleaseConfig.length, 1);
			options.debug = true;
			options.release = false;
			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInDebugConfig.length, 0);
		});

		it("throws exception when trying to add it to debug config", () => {
			options.debug = true;
			options.release = false;
			assert.throws(() => service.addPlugin(livePatchId).wait());
			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInDebugConfig.length, 0);
			options.debug = false;
			options.release = true;
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInReleaseConfig.length, 0);
		});

		it("adds plugin to release config only when both debug and release configs are specified", () => {
			options.debug = true;
			options.release = true;
			service.addPlugin(livePatchId).wait();
			options.release = false;
			let toastInDebugConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInDebugConfig.length, 0);
			options.debug = false;
			options.release = true;
			let toastInReleaseConfig = _.filter(service.getInstalledPlugins(), pl => pl.data.Identifier === livePatchId);
			assert.equal(toastInReleaseConfig.length, 1);
		});
	});

	describe("availableMarketplacePlugins are correct", () => {
		it("getAvailablePlugins returns correct plugins when their versions are supported", () => {
			let availableMarketplacePlugins = [
				{
					Identifier: "com.telerik.stripe",
					DefaultVersion: "1.0.4",
					Versions: [{
						Identifier: "com.telerik.stripe",
						Name: "Stripe",
						Version: "1.0.4",
						SupportedVersion: ">=3.5.0"
					}]
				},
				{
					Identifier: "nl.x-services.plugins.toast",
					DefaultVersion: "2.0.1",
					Versions: [{
						Identifier: "nl.x-services.plugins.toast",
						Name: "Toast",
						Version: "2.0.1",
						SupportedVersion: ">=3.5.0"
					}]
				}];

			let testInjector: IInjector = createTestInjectorForAvailableMarketplacePlugins(availableMarketplacePlugins);

			let project: Project.IProject = testInjector.resolve("project");
			project.projectData.FrameworkVersion = "3.5.0";
			let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
			let availablePlugins = service.getAvailablePlugins();
			assert.isTrue(_.some(availablePlugins, pl => pl.data.Identifier === "com.telerik.stripe"));
			assert.isTrue(_.some(availablePlugins, pl => pl.data.Identifier === "nl.x-services.plugins.toast"));
			// assert.equal(2, availablePlugins.length);
			// HACK - when LivePatch plugin is working correctly, remove the line below and use the assert above.
			assert.equal(3, availablePlugins.length);
		});

		it("getAvailablePlugins returns correct plugins when at least one of the versions is supported", () => {
			let availableMarketplacePlugins = [
				{
					Identifier: "com.telerik.stripe",
					DefaultVersion: "1.0.4",
					Versions: [{
						Identifier: "com.telerik.stripe",
						Name: "Stripe",
						Version: "1.0.4",
						SupportedVersion: ">=3.5.0"
					}]
				},
				{
					Identifier: "nl.x-services.plugins.toast",
					DefaultVersion: "2.0.1",
					Versions: [{
						Identifier: "nl.x-services.plugins.toast",
						Name: "Toast",
						Version: "2.0.1",
						SupportedVersion: ">=3.7.0"
					},
						{
							Identifier: "nl.x-services.plugins.toast",
							Name: "Toast",
							Version: "2.0.4",
							SupportedVersion: ">=3.5.0"
						},
						{
							Identifier: "nl.x-services.plugins.toast",
							Name: "Toast",
							Version: "2.0.5",
							SupportedVersion: ">=3.7.0"
						}]
				}];

			let testInjector: IInjector = createTestInjectorForAvailableMarketplacePlugins(availableMarketplacePlugins);

			let project: Project.IProject = testInjector.resolve("project");
			project.projectData.FrameworkVersion = "3.5.0";
			let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
			let availablePlugins = service.getAvailablePlugins();
			assert.isTrue(_.some(availablePlugins, pl => pl.data.Identifier === "com.telerik.stripe"));
			assert.isTrue(_.some(availablePlugins, pl => pl.data.Identifier === "nl.x-services.plugins.toast"));
			// assert.equal(2, availablePlugins.length);
			// HACK - when LivePatch plugin is working correctly, remove the line below and use the assert above.
			assert.equal(3, availablePlugins.length);
		});

		it("getAvailablePlugins returns correct plugins when none of the versions are supported", () => {
			let availableMarketplacePlugins = [
				{
					Identifier: "com.telerik.stripe",
					DefaultVersion: "1.0.4",
					Versions: [{
						Identifier: "com.telerik.stripe",
						Name: "Stripe",
						Version: "1.0.4",
						SupportedVersion: ">=3.5.0"
					}]
				},
				{
					Identifier: "nl.x-services.plugins.toast",
					DefaultVersion: "2.0.1",
					Versions: [{
						Identifier: "nl.x-services.plugins.toast",
						Name: "Toast",
						Version: "2.0.1",
						SupportedVersion: ">=3.7.0"
					},
						{
							Identifier: "nl.x-services.plugins.toast",
							Name: "Toast",
							Version: "2.0.4",
							SupportedVersion: ">=3.5.0"
						},
						{
							Identifier: "nl.x-services.plugins.toast",
							Name: "Toast",
							Version: "2.0.5",
							SupportedVersion: ">=3.7.0"
						}]
				}];

			let testInjector: IInjector = createTestInjectorForAvailableMarketplacePlugins(availableMarketplacePlugins);

			let project: Project.IProject = testInjector.resolve("project");
			project.projectData.FrameworkVersion = "3.2.0";
			let service: IPluginsService = testInjector.resolve(CordovaProjectPluginsService);
			let availablePlugins = service.getAvailablePlugins();
			assert.isFalse(_.some(availablePlugins, pl => pl.data.Identifier === "com.telerik.stripe"));
			assert.isFalse(_.some(availablePlugins, pl => pl.data.Identifier === "nl.x-services.plugins.toast"));
			// assert.equal(0, availablePlugins.length);
			// HACK - when LivePatch plugin is working correctly, remove the line below and use the assert above.
			assert.equal(1, availablePlugins.length);
		});
	});

	describe("plugins with variables are added correctly", () => {
		let testInjector: IInjector,
			options: IOptions,
			project: Project.IProject,
			service: IPluginsService,
			availableMarketplacePlugins = [{
				"Identifier": "com.telerik.dropbox",
				"DefaultVersion": "1.0.2",
				"Framework": "cordova",
				"Versions": [
					{
						"Publisher": {
							"Name": "Telerik plugins",
							"Url": "http://www.telerik.com/"
						},
						"Authors": [
							"Telerik"
						],
						"SupportedVersion": ">=3.5.0",
						"Name": "Dropbox",
						"Identifier": "com.telerik.dropbox",
						"Version": "1.0.2",
						"Description": "Cordova Sync SDK",
						"Url": "https://github.com/Telerik-Verified-Plugins/Dropbox",
						"Platforms": [
							"Android",
							"iOS"
						],
						"Variables": [
							"APP_KEY",
							"APP_SECRET"
						]
					}
				]
			},
				{
					"Identifier": "com.telerik.fakeDropBox",
					"DefaultVersion": "1.0.2",
					"Framework": "cordova",
					"Versions": [
						{
							"Publisher": {
								"Name": "Telerik plugins",
								"Url": "http://www.telerik.com/"
							},
							"Authors": [
								"Telerik"
							],
							"SupportedVersion": ">=3.5.0",
							"Name": "Dropbox",
							"Identifier": "com.telerik.dropbox",
							"Version": "1.0.2",
							"Description": "Cordova Sync SDK",
							"Url": "https://github.com/Telerik-Verified-Plugins/Dropbox",
							"Platforms": [
								"Android",
								"iOS"
							],
							"Variables": [
								"APP.KEY.VAR.DATA",
								"APP1.SECRET.SAMPLE.MSG"
							]
						}
					]
				},
				{
					"Identifier": "com.telerik.fakeDropBox2",
					"DefaultVersion": "1.0.2",
					"Framework": "cordova",
					"Versions": [
						{
							"Publisher": {
								"Name": "Telerik plugins",
								"Url": "http://www.telerik.com/"
							},
							"Authors": [
								"Telerik"
							],
							"SupportedVersion": ">=3.5.0",
							"Name": "Dropbox",
							"Identifier": "com.telerik.dropbox",
							"Version": "1.0.2",
							"Description": "Cordova Sync SDK",
							"Url": "https://github.com/Telerik-Verified-Plugins/Dropbox",
							"Platforms": [
								"Android",
								"iOS"
							],
							"Variables": [
								"APP.KEY.VAR.DATA",
								"APP.KEY.SAME.MSG"
							]
						}
					]
				}];

		beforeEach(() => {
			testInjector = createTestInjectorForAvailableMarketplacePlugins(availableMarketplacePlugins);

			options = testInjector.resolve("options");
			project = testInjector.resolve("project");
			service = testInjector.resolve(CordovaProjectPluginsService);
		});

		it("when var option does not have configuration variables plugin vars are added to both configs", () => {
			let expectedCordovaPluginVariables = { 'com.telerik.dropbox': { APP_KEY: '1', APP_SECRET: '2' } };
			options.var = {
				"APP_KEY": 1,
				"APP_SECRET": 2
			};

			service.addPlugin("com.telerik.dropbox").wait();

			assert.deepEqual(expectedCordovaPluginVariables, project.configurationSpecificData["debug"]["CordovaPluginVariables"]);
			assert.deepEqual(expectedCordovaPluginVariables, project.configurationSpecificData["release"]["CordovaPluginVariables"]);
		});

		it("when var option has configuration variables plugin vars are added to correct configs", () => {
			let expectedCordovaPluginVariablesInDebug = { 'com.telerik.dropbox': { APP_KEY: '1', APP_SECRET: '2' } };
			let expectedCordovaPluginVariablesInRelease = { 'com.telerik.dropbox': { APP_KEY: '3', APP_SECRET: '4' } };
			options.var = {
				"debug": {
					"APP_KEY": 1,
					"APP_SECRET": 2
				},
				"release": {
					"APP_KEY": 3,
					"APP_SECRET": 4
				}
			};

			service.addPlugin("com.telerik.dropbox").wait();

			assert.deepEqual(expectedCordovaPluginVariablesInDebug, project.configurationSpecificData["debug"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in debug config.");
			assert.deepEqual(expectedCordovaPluginVariablesInRelease, project.configurationSpecificData["release"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in release config.");
		});

		it("when var option has configuration variables and plugin vars outside of them, plugin vars from configuration are used", () => {
			let expectedCordovaPluginVariablesInDebug = { 'com.telerik.dropbox': { APP_KEY: '1', APP_SECRET: '2' } };
			let expectedCordovaPluginVariablesInRelease = { 'com.telerik.dropbox': { APP_KEY: '3', APP_SECRET: '4' } };
			options.var = {
				"debug": {
					"APP_KEY": 1,
					"APP_SECRET": 2
				},
				"release": {
					"APP_KEY": 3,
					"APP_SECRET": 4
				},
				"APP_KEY": 5,
				"APP_SECRET": 6
			};

			service.addPlugin("com.telerik.dropbox").wait();

			assert.deepEqual(expectedCordovaPluginVariablesInDebug, project.configurationSpecificData["debug"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in debug config.");
			assert.deepEqual(expectedCordovaPluginVariablesInRelease, project.configurationSpecificData["release"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in release config.");
		});

		it("when var option has configuration variables for only one plugin var, the other values are populated from the var object", () => {
			let expectedCordovaPluginVariablesInDebug = { 'com.telerik.dropbox': { APP_KEY: '1', APP_SECRET: '3' } };
			let expectedCordovaPluginVariablesInRelease = { 'com.telerik.dropbox': { APP_KEY: '2', APP_SECRET: '3' } };
			options.var = {
				"debug": {
					"APP_KEY": 1
				},
				"APP_KEY": 2,
				"APP_SECRET": 3
			};

			service.addPlugin("com.telerik.dropbox").wait();

			assert.deepEqual(expectedCordovaPluginVariablesInDebug, project.configurationSpecificData["debug"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in debug config.");
			assert.deepEqual(expectedCordovaPluginVariablesInRelease, project.configurationSpecificData["release"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in release config.");
		});

		it("when plugin variable is missing from var option, the value for it is taken from prompter", () => {
			let APP_SECRET_VARIABLE = { "APP_SECRET": "4" };
			let injector = createTestInjectorForAvailableMarketplacePlugins(availableMarketplacePlugins, APP_SECRET_VARIABLE);
			let expectedCordovaPluginVariablesInDebug = { 'com.telerik.dropbox': { APP_KEY: '1', APP_SECRET: '2' } };
			let expectedCordovaPluginVariablesInRelease = { 'com.telerik.dropbox': { APP_KEY: '3', APP_SECRET: '4' } };
			options = injector.resolve("options");
			options.var = {
				"debug": {
					"APP_KEY": 1,
					"APP_SECRET": 2
				},
				"release": {
					"APP_KEY": 3
				}
			};
			service = injector.resolve(CordovaProjectPluginsService);
			project = injector.resolve("project");
			service.addPlugin("com.telerik.dropbox").wait();

			assert.deepEqual(expectedCordovaPluginVariablesInDebug, project.configurationSpecificData["debug"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in debug config.");
			assert.deepEqual(expectedCordovaPluginVariablesInRelease, project.configurationSpecificData["release"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in release config.");
		});

		it("when var option has configuration variables with different case, plugin variables are still saved as expected", () => {
			let expectedCordovaPluginVariablesInDebug = { 'com.telerik.dropbox': { APP_KEY: '1', APP_SECRET: '3' } };
			let expectedCordovaPluginVariablesInRelease = { 'com.telerik.dropbox': { APP_KEY: '2', APP_SECRET: '3' } };
			options.var = {
				"DeBuG": {
					"APP_KEY": 1
				},
				"APP_Key": 2,
				"ApP_SecReT": 3
			};

			service.addPlugin("com.telerik.dropbox").wait();

			assert.deepEqual(expectedCordovaPluginVariablesInDebug, project.configurationSpecificData["debug"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in debug config.");
			assert.deepEqual(expectedCordovaPluginVariablesInRelease, project.configurationSpecificData["release"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in release config.");
		});

		it("when plugin variables have dots, yargs object is correctly converted and correct value is used", () => {
			let expectedCordovaPluginVariables = { 'com.telerik.fakeDropBox': { "APP.KEY.VAR.DATA": '1', "APP1.SECRET.SAMPLE.MSG": '2' } };
			options.var = {
				APP: { KEY: { VAR: { DATA: "1" } } },
				APP1: { SECRET: { SAMPLE: { MSG: "2" } } }
			};

			service.addPlugin("com.telerik.fakeDropBox").wait();

			assert.deepEqual(expectedCordovaPluginVariables, project.configurationSpecificData["debug"]["CordovaPluginVariables"]);
			assert.deepEqual(expectedCordovaPluginVariables, project.configurationSpecificData["release"]["CordovaPluginVariables"]);
		});

		it("when plugin variables have dots and user pass configuration specific values, yargs object is correctly converted and correct values are used", () => {
			let expectedCordovaPluginVariablesInDebug = { 'com.telerik.fakeDropBox': { "APP.KEY.VAR.DATA": '1', "APP1.SECRET.SAMPLE.MSG": '2' } };
			let expectedCordovaPluginVariablesInRelease = { 'com.telerik.fakeDropBox': { "APP.KEY.VAR.DATA": '3', "APP1.SECRET.SAMPLE.MSG": '4' } };
			options.var = {
				debug: {
					APP: { KEY: { VAR: { DATA: "1" } } },
					APP1: { SECRET: { SAMPLE: { MSG: "2" } } }
				},
				release: {
					APP: { KEY: { VAR: { DATA: "3" } } },
					APP1: { SECRET: { SAMPLE: { MSG: "4" } } }
				}
			};

			service.addPlugin("com.telerik.fakeDropBox").wait();

			assert.deepEqual(expectedCordovaPluginVariablesInDebug, project.configurationSpecificData["debug"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in debug config.");
			assert.deepEqual(expectedCordovaPluginVariablesInRelease, project.configurationSpecificData["release"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in release config.");
		});

		it("when plugin variables have dots and user pass configuration specific values and non-config ones correct ones are used after yargs convertion", () => {
			let expectedCordovaPluginVariablesInDebug = { 'com.telerik.fakeDropBox': { "APP.KEY.VAR.DATA": '1', "APP1.SECRET.SAMPLE.MSG": '3' } };
			let expectedCordovaPluginVariablesInRelease = { 'com.telerik.fakeDropBox': { "APP.KEY.VAR.DATA": '2', "APP1.SECRET.SAMPLE.MSG": '3' } };
			options.var = {
				debug: {
					APP: { KEY: { VAR: { DATA: "1" } } }
				},
				APP: { KEY: { VAR: { DATA: "2" } } },
				APP1: { SECRET: { SAMPLE: { MSG: "3" } } }
			};

			service.addPlugin("com.telerik.fakeDropBox").wait();

			assert.deepEqual(expectedCordovaPluginVariablesInDebug, project.configurationSpecificData["debug"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in debug config.");
			assert.deepEqual(expectedCordovaPluginVariablesInRelease, project.configurationSpecificData["release"]["CordovaPluginVariables"], "CordovaPluginVariables do not match in release config.");
		});

		it("when plugin variables have dots and first key of variables is the same yargs object is correctly converted and correct value is used", () => {
			let expectedCordovaPluginVariables = { 'com.telerik.fakeDropBox2': { "APP.KEY.VAR.DATA": '1', "APP.KEY.SAME.MSG": '2' } };
			options.var = {
				APP: {
					KEY: {
						VAR: { DATA: "1" },
						SAME: { MSG: "2" }
					}
				}
			};

			service.addPlugin("com.telerik.fakeDropBox2").wait();

			assert.deepEqual(expectedCordovaPluginVariables, project.configurationSpecificData["debug"]["CordovaPluginVariables"]);
			assert.deepEqual(expectedCordovaPluginVariables, project.configurationSpecificData["release"]["CordovaPluginVariables"]);
		});
	});
});


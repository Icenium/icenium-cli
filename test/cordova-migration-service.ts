import Future = require("fibers/future");
import yok = require("../lib/common/yok");
import * as cordovaMigrationService from "../lib/services/cordova-migration-service";
import {assert} from "chai";

let testInjector = new yok.Yok();
testInjector.register("server", {});
testInjector.register("errors", {});
testInjector.register("logger", {});
testInjector.register("mobileHelper", {});
testInjector.register("pluginsService", {
	getPluginBasicInformation: (pluginName: string) => Promise.resolve({ name: 'Name', version: '1.0.0' }),
	getPluginVersions: (plugin: IPlugin) => {
		return [{
			name: '1.0.0',
			value: '1.0.0',
			minCordova: '3.0.0'
		}];
	},
	removePlugin: (pluginName: string) => { return Promise.resolve(); },
	isPluginSupported: (plugin: IPlugin, version: string, migrationVersion: string) => { return true;}
});
testInjector.register("project", {});
testInjector.register("projectConstants", {});
testInjector.register("projectPropertiesService", {});
testInjector.register("prompter", {
	promptForChoice: (promptMessage: string, choices: any[]) => { return Promise.resolve<string>(choices[0]); }
});
testInjector.register("resources", {resolvePath: (x: string) => ""});
testInjector.register("loginManager", { ensureLoggedIn: (): IFuture<void> => { return Promise.resolve(); }});
testInjector.register("webViewService", {});
testInjector.register("serverConfiguration", {});
testInjector.register("httpClient", {});
testInjector.register("cordovaResources", {});

function registerMockedFS(mockResult: any): void {
	testInjector.register("fs", {
		readJson: () => mockResult,
	});
}

describe("cordova-migration-service", () => {
	describe("migratePlugins", () => {
		it("Return unchanged plugins if no rename matches", () => {
			registerMockedFS({
				renamedPlugins:
				[{
					version: "3.2.0",
					oldName: "org.apache.cordova.AudioHandler",
					newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.2.0": ["org.apache.cordova.media", "plugin"]
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["plugin"], "3.0.0", "3.2.0"), ["plugin"]);
		});

		it("Return unchanged plugins if a rename matches but it's for a later version", () => {
			registerMockedFS({
				renamedPlugins:
				[{
					version: "3.4.0",
					oldName: "org.apache.cordova.AudioHandler",
					newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.2.0": ["org.apache.cordova.AudioHandler"],
					"3.4.0": ["org.apache.cordova.media"]
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["org.apache.cordova.AudioHandler"], "3.0.0", "3.2.0"), ["org.apache.cordova.AudioHandler"]);
		});

		it("Remove plugins if they are no longer available in the version we are migrating to", () => {
			registerMockedFS({
				renamedPlugins: [],
				integratedPlugins: {
					"3.0.0": ["org.apache.cordova.camera"],
					"3.2.0": ["org.apache.cordova.camera", "org.apache.cordova.statusbar"]
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["org.apache.cordova.camera", "org.apache.cordova.statusbar"], "3.2.0", "3.0.0"), ["org.apache.cordova.camera"]);
		});

		it("Return renamed plugin if a rename matches", () => {
			registerMockedFS({
				renamedPlugins: [{
					version: "3.2.0",
					oldName: "org.apache.cordova.AudioHandler",
					newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.2.0": ["org.apache.cordova.media"]
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["org.apache.cordova.AudioHandler"], "3.0.0", "3.2.0"), ["org.apache.cordova.media"]);
		});

		it("Return renamed plugin if a rename matches and it is a downgrade", () => {
			registerMockedFS({
				renamedPlugins: [{
					version: "3.2.0",
					oldName: "org.apache.cordova.AudioHandler",
					newName: "org.apache.cordova.media"
				}],
				integratedPlugins: {
					"3.0.0": ["org.apache.cordova.AudioHandler"],
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["org.apache.cordova.media"], "3.2.0", "3.0.0"), ["org.apache.cordova.AudioHandler"]);
		});

		it("Adds default enabled plugin", () => {
			registerMockedFS({
				renamedPlugins: [],
				defaultEnabledPluginsIncludeRegex: "(cordova-plugin-whitelist)",
				defaultEnabledPluginsExcludeRegex: "^$",

				integratedPlugins: {
					"4.0.0": ["cordova-plugin-whitelist"],
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins([], "3.0.0", "4.0.0"), ["cordova-plugin-whitelist"]);
		});

		it("Adds default enabled plugin and respects exclusions", () => {
			registerMockedFS({
				renamedPlugins: [],
				defaultEnabledPluginsIncludeRegex: "(cordova-plugin-whitelist)|(cordova-plugin-bla)",
				defaultEnabledPluginsExcludeRegex: ".*bla",

				integratedPlugins: {
					"4.0.0": ["cordova-plugin-whitelist", "cordova-plugin-bla"],
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins([], "3.0.0", "4.0.0"), ["cordova-plugin-whitelist"]);
		});

		it("Return renamed plugin if a rename matches and new plugin is marketplace", () => {
			registerMockedFS({
				renamedPlugins: [{
					version: "3.7.0",
					oldName: "org.apache.cordova.sqlite",
					newName: "org.apache.cordova.sqlite@1.0.2"
				}],
				integratedPlugins: {
					"3.5.0": ["org.apache.cordova.sqlite"],
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["org.apache.cordova.sqlite"], "3.5.0", "3.7.0"), ["org.apache.cordova.sqlite@1.0.2"]);
		});

		it("Return renamed plugin if there is a rename chain", () => {
			registerMockedFS({
				renamedPlugins: [{
					version: "3.2.0",
					oldName: "org.apache.cordova.AudioHandler",
					newName: "org.apache.cordova.media"
				},
				{
					version: "3.4.0",
					oldName: "org.apache.cordova.media",
					newName: "org.apache.cordova.NewMedia"
					}],
				integratedPlugins: {
					"3.4.0": ["org.apache.cordova.NewMedia"]
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["org.apache.cordova.AudioHandler"], "3.0.0", "3.4.0"), ["org.apache.cordova.NewMedia"]);
		});

		it("Return renamed plugin if there is a rename chain when downgrading", () => {
			registerMockedFS({
				renamedPlugins: [{
					version: "3.2.0",
					oldName: "org.apache.cordova.AudioHandler",
					newName: "org.apache.cordova.media"
				},
				{
					version: "3.4.0",
					oldName: "org.apache.cordova.media",
					newName: "org.apache.cordova.NewMedia"
					}],
				integratedPlugins: {
					"3.0.0": ["org.apache.cordova.AudioHandler"]
				}
			});

			let service: ICordovaMigrationService = testInjector.resolve(cordovaMigrationService.CordovaMigrationService);
			await assert.deepEqual(service.migratePlugins(["org.apache.cordova.NewMedia"], "3.4.0", "3.0.0"), ["org.apache.cordova.AudioHandler"]);
		});
	});
});

///<reference path=".d.ts"/>
"use strict";

import {Yok} from "../lib/common/yok";
import * as stubs from "./stubs";
import Future = require("fibers/future");
import {ProjectConstants} from "../lib/project/project-constants";
import * as shelljs from "shelljs";
import * as assert from "assert";

import * as pluginsData from "../lib/plugins-data";

import {NativeScriptProjectPluginsService} from "../lib/services/nativescript-project-plugins-service";

let supportedFrameworkVersion = "1.3.0";
let dummyString = "dummy";

export class FileSystemStub {
	public projectPackageJsonExists: boolean;
	public fileExists: boolean;
	public jsonContent: string;

	public exists(path: string): IFuture<boolean> {
		if(path.indexOf("package.json") !== -1) {
			return Future.fromResult(this.projectPackageJsonExists);
		} else {
			return Future.fromResult(this.fileExists);
		}
	}

	public deleteDirectory(directory: string): IFuture<void> {
		return Future.fromResult();
	}

	public readJson(filename: string, encoding?: string): IFuture<any> {
		let data: any;
		if(filename === "nativeScriptMigrationFile") {
			data = JSON.parse(`{"npmVersions": [{ "version": "${supportedFrameworkVersion}" }]}`);
		} else if(this.jsonContent) {
			data = JSON.parse(this.jsonContent);
		}

		return Future.fromResult(data);
	}

	public writeJson(filename: string, data: any, space?: string, encoding?: string): IFuture<void> {
		return Future.fromResult();
	}

	public copyFile(sourceFileName: string, destinationFileName: string): IFuture<void> {
		return Future.fromResult();
	}

	public readText(filename: string, options?: any): IFuture<string> {
		return Future.fromResult("");
	}
}

let validNativeScriptGetMarketplacePluginVersionsDataResult = [
	{
		"Versions": [
			{
				"Authors": ["author"],
				"DownloadsCount": 16,
				"SupportedVersion": ">1.0.0",
				"Name": "test-plugin",
				"Identifier": "test-plugin-identifier",
				"Version": "1.0.0",
				"Description": "Short description",
				"Url": "https://github.com/someGitHubUrl",
				"Platforms": [
					"iOS",
					"Android"
				],
				"Variables": <any[]>[]
			}
		],
		"Identifier": "test-plugin-identifier",
		"DefaultVersion": "1.0.0",
		"Framework": "nativescript",
		"PageUrl": "https://sitplugins.telerik.com/nativescript/plugin/test-plugins"
	}
];

function createTestInjector(npmInstallOutput: string, httpRequestResult: string, projectFrameworkVersion?: string): IInjector {
	let testInjector = new Yok();
	projectFrameworkVersion = projectFrameworkVersion || supportedFrameworkVersion;
	testInjector.register("childProcess", {
		exec: (command: string, options: any) => {
			// add tests when the output matches regex: /.*?@.*?\s+?(.*?node_modules.*?)\r?\n?$/m and when it does not
			return npmInstallOutput;
		},
	});
	// add tests that assure constructor fails when project is not nativescript
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("fs", FileSystemStub);
	// add tests when result contains nativescript key and when it does not
	testInjector.register("httpClient", {
		httpRequest: (url: string): IFuture<any> => {
			return Future.fromResult({
				body: httpRequestResult
			});
		}
	});
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("nativeScriptResources", {
		nativeScriptMigrationFile: "nativeScriptMigrationFile",
		nativeScriptDefaultPackageJsonFile: "defaultNativeScriptDefaultPackageJsonFile"
	});
	testInjector.register("project", {
		projectData: {
			FrameworkVersion: projectFrameworkVersion,
		},
		getProjectDir: (): IFuture<string> => Future.fromResult("projectDir"),
		getProperty: (prop: string, config: string): any => null
	});
	testInjector.register("projectConstants", ProjectConstants);
	testInjector.register("server", {
		nativescript: {
			getMarketplacePluginVersionsData: () => {
				return Future.fromResult(validNativeScriptGetMarketplacePluginVersionsDataResult);
			}
		}
	});



	shelljs.cp = (arg: string, sourcePath: any, destinationPath: string) => {
		// console.log(">>>>>>>>>>>>>>>>>>> shelljs CP CALLED");
	};

	testInjector.register("nativeScriptProjectPluginsService",NativeScriptProjectPluginsService);
	return testInjector;
}

describe("nativeScriptProjectPluginsService", () => {
	describe("constructor tests", () => {
		it("fails when projects frameworkVersion is not supported", () => {
			let testInjector = createTestInjector(dummyString, dummyString, "5");
			assert.throws(() => testInjector.resolve("nativeScriptProjectPluginsService"), "The constructor of nativeScriptProjectPluginsService should fail when project Framework version does not support plugins.");
		});

		it("does not fail when projects frameworkVersion is supported", () => {
			let testInjector = createTestInjector(dummyString, dummyString, supportedFrameworkVersion);
			let nativeScriptProjectPluginsService: any;
			try {
				nativeScriptProjectPluginsService = testInjector.resolve("nativeScriptProjectPluginsService");
			} catch (err) {
				console.log("Error while resolving nativeScriptProjectPluginsService", err);
			}
			assert.ok(nativeScriptProjectPluginsService, "The constructor of nativeScriptProjectPluginsService should NOT fail when project Framework version supports plugins.");
		});
	});

	describe("getInstalledPlugins", () => {
/// BUG - `appbuilder plugin` does not print info for plugins that are not published in npm
/// BUG - `appbuilder plugin` does not print info for local plugins
		let testInjector: IInjector,
			fs: FileSystemStub,
			nativeScriptProjectPluginsService: IPluginsService;

		beforeEach(() =>{
			testInjector = createTestInjector(dummyString, dummyString);
			fs = testInjector.resolve("fs");
			nativeScriptProjectPluginsService = testInjector.resolve("nativeScriptProjectPluginsService");
		});

		describe("does not return plugins", () => {
			it("when package.json does not exist", () => {
				fs.projectPackageJsonExists = false;
				let installedPlugins = nativeScriptProjectPluginsService.getInstalledPlugins();
				assert.deepEqual(installedPlugins, null, "When there's no package.json, getInstalledPlugins must return null.");
			});

			it("when package.json is empty", () => {
				fs.projectPackageJsonExists = true;
				fs.jsonContent = '';
				let installedPlugins = nativeScriptProjectPluginsService.getInstalledPlugins();
				assert.deepEqual(installedPlugins, null, "When the package.json is empty, getInstalledPlugins must return null.");
			});

			it("when package.json does not have dependencies", () => {
				fs.projectPackageJsonExists = true;
				fs.jsonContent = '{}';
				let installedPlugins = nativeScriptProjectPluginsService.getInstalledPlugins();
				assert.deepEqual(installedPlugins, null, "When there's package.json does not have dependencies, getInstalledPlugins must return null.");
			});

			it("when dependency info cannot be found", () => {
				fs.projectPackageJsonExists = true;
				fs.fileExists = false;
				fs.jsonContent = '{"dependencies": { "invalidPluginName": "1.0.0" }}';
				let installedPlugins = nativeScriptProjectPluginsService.getInstalledPlugins();
				assert.deepEqual(installedPlugins, [], "When the dependencies are invalid, getInstalledPlugins must return empty array.");
			});
		});

		describe("returns correct plugins", () => {
			it("finds correct marketplace plugin", () => {
				fs.projectPackageJsonExists = true;
				fs.fileExists = false;
				fs.jsonContent = '{"dependencies": { "test-plugin": "1.0.0" }}';
				let installedPlugins = nativeScriptProjectPluginsService.getInstalledPlugins();
				assert.deepEqual(installedPlugins[0].data, validNativeScriptGetMarketplacePluginVersionsDataResult[0].Versions[0], "When the dependencies are valid, getInstalledPlugins must return correct result.");
			});

			it("finds correct plugin from npm", () => {
				fs.projectPackageJsonExists = true;
				fs.fileExists = false;
				fs.jsonContent = '{"dependencies": { "npm-plugin": "1.0.0" }}';
				let installedPlugins = nativeScriptProjectPluginsService.getInstalledPlugins();
				assert.deepEqual(installedPlugins[0].data, validNativeScriptGetMarketplacePluginVersionsDataResult[0].Versions[0], "When the dependencies are valid, getInstalledPlugins must return correct result.");
			});
		});
	});
});

// /**
// 	 * Gets all available plugins for the current project type.
// 	 * NOTE: For NativeScript projects the count of listed NPM packages and NPM plugins is controlled
// 	 * via pluginsCount parameter.
// 	 * @param {number} pluginsCount - number of NPM packages and NativeScript NPM Plugins to be shown.
// 	 * The count is for each of the groups separately.
// 	 * @return {IPlugin[]} - Array of plugins found.
// 	 */
// 	getAvailablePlugins(pluginsCount?: number): IPlugin[];
//
// 	/**
// 	 * Provides information about all installed plugins.
// 	 * @return {IPlugin[]} Array of all installed plugins and information about each of them.
// 	 */
// 	getInstalledPlugins(): IPlugin[];
//
// 	/**
// 	 * Shows information about specified plugins.
// 	 * @param {IPlugin[]} plugins Array of plugins that will be printed.
// 	 * @return {void}
// 	 */
// 	printPlugins(plugins: IPlugin[]): void;
//
// 	/**
// 	 * Adds plugin to the current project, so it can be used in the application.
// 	 * @param {string} pluginName The name of the plugin that has to be added. It can contains the required version.
// 	 * For example these are valid names: "lodash", "lodash@3.10.1"
// 	 * @return {IFuture<void>}
// 	 */
// 	addPlugin(pluginName: string): IFuture<void>;
//
// 	/**
// 	 * Removes plugin from the current project.
// 	 * @param {string} pluginName The name of the plugin that has to be removed.
// 	 * @return {IFuture<void>}
// 	 */
// 	removePlugin(pluginName: string): IFuture<void>;
//
// 	/**
// 	 * Used to configure a plugin.
// 	 * @param  {string}        pluginName     The name of the plugin.
// 	 * @param  {string}        version        The version of the plugin.
// 	 * @param  {string[]}      configurations Configurations in which the plugin should be configured. Example: ['debug'], ['debug', 'release']
// 	 * @return {IFuture<void>}
// 	 */
// 	configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void>;
//
// 	/**
// 	 * Checks if the specified plugin is installed for the current project.
// 	 * @param {string} pluginName The name of the plugin which has to be checked. It can contain the required version.
// 	 * For example these are valid names: "lodash", "lodash@3.10.1"
// 	 * @return {boolean} 'true' in case the plugin with specified version is installed, false otherwise.
// 	 */
// 	isPluginInstalled(pluginName: string): boolean;
// 	/**
// 	 * Returns basic information about the plugin - it's name, version and cordova version range
// 	 * @param  {string}                  pluginName The name of the plugin
// 	 * @return {IBasicPluginInformation}            Basic information about the plugin
// 	 */
// 	getPluginBasicInformation(pluginName: string): IBasicPluginInformation;
//
// 	/**
// 	 * Copies the source code of a plugin inside the project and adds it as a reference, so it can be used within the application.
// 	 * @param {string} pluginIdentifier The identifier of the plugin that will be copied to the source code.
// 	 * @return {IFuture<void>}
// 	 */
// 	fetch(pluginIdentifiers: string): IFuture<void>;
//
// 	/**
// 	 * Search for plugins based on specified keywords and returns basic information about each of them.
// 	 * @param {string[]} keywords Array of keywords that will be used for searching.
// 	 * @return {IBasicPluginInformation[]} Array of information for all available plugins matching at least one of the specified keywords.
// 	 */
// 	findPlugins(keywords: string[]): IFuture<IBasicPluginInformation[]>;

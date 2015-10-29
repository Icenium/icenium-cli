///<reference path="../.d.ts"/>
"use strict";

import * as path from "path";
import * as util from "util";
import {EOL} from "os";
import * as shelljs from "shelljs";
import * as semver from "semver";
import {getFuturesResults} from "../common/helpers";
import {MarketplacePluginData} from "../plugins-data";
import Future = require("fibers/future");
import temp = require("temp");
temp.track();

export class NativeScriptProjectPluginsService implements IPluginsService {
	private static HEADERS = ["NPM Packages", "NPM NativeScript Plugins", "Marketplace Plugins"];
	private static DEFAULT_NUMBER_OF_NPM_PACKAGES = 10;
	private static NPM_REGISTRY_URL = "https://registry.npmjs.org";
	private static NPM_SEARCH_URL = "http://npmsearch.com";
	private static NODE_MODULES_DIR_NAME = "node_modules";

	constructor(private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $nativeScriptResources: INativeScriptResources,
		private $project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $server: Server.IServer) {
			let npmVersions: string[] = (<any[]>this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile).wait().npmVersions).map(npmVersion => npmVersion.version);
			let frameworkVersion = this.$project.projectData.FrameworkVersion;
			if(!_.contains(npmVersions, frameworkVersion)) {
				this.$errors.failWithoutHelp(`Your project targets NativeScript version '${frameworkVersion}' which does not support plugins.`);
			}
		}

	public getAvailablePlugins(pluginsCount?: number): IPlugin[] {
		let count = pluginsCount || NativeScriptProjectPluginsService.DEFAULT_NUMBER_OF_NPM_PACKAGES;
		let futures = [
			this.getUniqueMarketplacePlugins(),
			this.getTopNpmPackages(count),
			this.getTopNativeScriptNpmPackages(count)
		];

		return getFuturesResults<IPlugin>(futures, res => !!res);
	}

	public findPlugins(keywords: string[]): IFuture<IBasicPluginInformation[]> {
		return ((): IBasicPluginInformation[] => {
			let findPluginByNameFutures = _.map(keywords, keyword => this.findPluginsByName(keyword));
			Future.wait(findPluginByNameFutures);
			let findPluginsResults: IBasicPluginInformation[][] = findPluginByNameFutures.map(f => f.get()).filter(plugins => !!plugins && !!plugins.length);

			let pluginsNamesInGroups = findPluginsResults.map(res => _.map(res, r => r.name));
			let matchingNames = _.intersection.apply(this, pluginsNamesInGroups);
			let pluginsFound: IBasicPluginInformation[] = [];
			_.each(_.flatten<IBasicPluginInformation>(findPluginsResults), basicInfo => {
				if(!_.any(pluginsFound, pl => pl.name === basicInfo.name) && _.contains(matchingNames, basicInfo.name)) {
					pluginsFound.push(basicInfo);
				}
			});

			return pluginsFound;
		}).future<IBasicPluginInformation[]>()();
	}

	public getInstalledPlugins(): IPlugin[] {
		let pathToPackageJson = this.getPathToProjectPackageJson().wait();

		if(this.$fs.exists(pathToPackageJson).wait()) {
			let content = this.$fs.readJson(pathToPackageJson).wait();
			if(content && content.dependencies) {
				let items =  _.map(content.dependencies, (version: string, name: string) => {
					let marketplacePlugin = _.find(this.getMarketplacePlugins().wait(), pl => pl.data.Name === name && pl.data.Version === version);
					let plugin = marketplacePlugin || this.getDataForNpmPackage(name, version).wait()
								|| this.getDataForLocalPlugin(name, version).wait()
								|| this.getDataFromGitHubUrl(name, version).wait();
					if(!plugin) {
						this.$logger.warn(`Unable to find information about plugin '${name}' with version '${version}'.`);
					}
					return plugin;
				}).filter(i => !!i);

				return items;
			}
		}

		return null;
	}

	public printPlugins(plugins: IPlugin[]): void {
		let groups = _.groupBy(plugins, (plugin: IPlugin) => plugin.type);
		let outputLines:string[] = [];

		_.each(Object.keys(groups), (group: string) => {
			outputLines.push(util.format("%s:%s======================", NativeScriptProjectPluginsService.HEADERS[+group], EOL));

			let sortedPlugins = _.sortBy(groups[group], (plugin: IPlugin) => plugin.data.Name);
			_.each(sortedPlugins, (plugin: IPlugin) => {
				outputLines.push(plugin.pluginInformation.join(EOL));
			});
		});

		this.$logger.out(outputLines.join(EOL + EOL));
	}

	public addPlugin(pluginIdentifier: string): IFuture<void> {
		return (() => {
			if(this.isPluginInstalled(pluginIdentifier)) {
				this.$logger.printMarkdown(util.format("Plugin `%s` is already installed.", pluginIdentifier));
				return;
			}

			if(this.checkIsValidLocalPlugin(pluginIdentifier).wait()) {
				this.installLocalPlugin(pluginIdentifier).wait();
				return;
			}

			let pathToPackageJson = this.getPathToProjectPackageJson().wait();
			let packageJsonContent = this.getProjectPackageJsonContent().wait();
			let pluginBasicInfo = this.getPluginBasicInformation(pluginIdentifier);
			let name = pluginBasicInfo.name;
			let selectedVersion = pluginBasicInfo.version || "latest";
			let basicPlugin = this.getBasicPluginInfoFromMarketplace(name, selectedVersion).wait() ||
								this.getBasicPluginInfoFromNpm(name, selectedVersion).wait() ||
								this.getBasicPluginInfoFromUrl(pluginIdentifier).wait();

			if(!basicPlugin) {
				this.$errors.failWithoutHelp(`Unable to add plugin ${pluginIdentifier}. Make sure you've provided a valid name, path to local directory or github URL.`);
			}

			packageJsonContent.dependencies[basicPlugin.name] = basicPlugin.version;
			this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();
			this.$logger.printMarkdown(util.format("Successfully added plugin `%s`.", pluginIdentifier));
		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			let pathToPackageJson = this.getPathToProjectPackageJson().wait();
			let packageJsonContent = this.getProjectPackageJsonContent().wait();
			let pluginBasicInfo = this.getPluginBasicInformation(pluginName);
			if(packageJsonContent.dependencies[pluginBasicInfo.name]) {
				let pathToPlugin = packageJsonContent.dependencies[pluginBasicInfo.name].toString().replace("file:","");
				if(this.checkIsValidLocalPlugin(pathToPlugin).wait()) {
					this.$fs.deleteDirectory(path.resolve(pathToPlugin)).wait();
				}
				delete packageJsonContent.dependencies[pluginBasicInfo.name];
				this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();
				this.$logger.printMarkdown(util.format("Successfully removed plugin `%s`.", pluginName));
			} else {
				this.$logger.printMarkdown(util.format("Plugin `%s` is not installed.", pluginName));
			}
		}).future<void>()();
	}

	public configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void> {
		return (() => {
			throw new Error("This operation is not supported for NativeScript Plugins.");
		}).future<void>()();
	}

	public isPluginInstalled(pluginName: string): boolean {
		let packageJsonContent = this.getProjectPackageJsonContent().wait();
		let pluginBasicInfo = this.getPluginBasicInformation(pluginName);
		return packageJsonContent
				&& !!packageJsonContent.dependencies && !!packageJsonContent.dependencies[pluginBasicInfo.name]
				&& (!pluginBasicInfo.version || packageJsonContent.dependencies[pluginBasicInfo.name] === pluginBasicInfo.version);
	}

	public getPluginBasicInformation(pluginName: string): IBasicPluginInformation {
		let [ name, version ] = pluginName.split("@");
		return { name, version };
	}

	public fetch(pluginIdentifier: string): IFuture<void> {
		return (() => {
			if(!pluginIdentifier) {
				this.$errors.fail("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the NPM.");
			}

			let pathToInstalledPlugin = this.installPackageToTempDir(pluginIdentifier).wait();
			if(pathToInstalledPlugin) {
				let pluginsPath = path.join(this.$project.getProjectDir().wait(), "plugins");
				// use cp instead of mv, as it would fail if pathToInstalledPlugin is mounted
				// on a different device from the pluginsPath with error:
				// Error: EXDEV, cross-device link not permitted
				shelljs.cp("-Rf", [pathToInstalledPlugin], pluginsPath);
				this.installLocalPlugin(path.join(pluginsPath, path.basename(pathToInstalledPlugin))).wait();
			} else {
				let errorMessage =`Unable to add plugin ${pluginIdentifier}.` +
					" Make sure this is a valid plugin name, path to existing directory or github URL.";
				this.$errors.failWithoutHelp(errorMessage);
			}
		}).future<void>()();
	}

	private marketplacePlugins: IPlugin[];
	private getMarketplacePlugins(): IFuture<IPlugin[]> {
		return ((): IPlugin[] => {
			if(!this.marketplacePlugins || !this.marketplacePlugins.length) {
				try {
					let plugins = this.$server.nativescript.getMarketplacePluginVersionsData().wait();
					this.marketplacePlugins = [];
					_.each(plugins, plugin => {
						let versions = _.map(plugin.Versions, (pluginVersionData) =>
												new MarketplacePluginData(<any>plugin, <any>pluginVersionData, this.$project, this.$projectConstants));
						this.marketplacePlugins = this.marketplacePlugins.concat(versions);
					});
				} catch(err) {
					this.$logger.trace("Unable to get NativeScript Marketplace plugins.");
					this.$logger.trace(err);
					this.marketplacePlugins = null;
				}
			}

			return this.marketplacePlugins;
		}).future<IPlugin[]>()();
	}

	private getUniqueMarketplacePlugins(): IFuture<IPlugin[]> {
		return ((): IPlugin[] => {
			return _(this.getMarketplacePlugins().wait())
					.groupBy(pl => pl.data.Name)
					.map((pluginGroup: IPlugin[]) => _(pluginGroup)
														.sortBy(gr => gr.data.Version)
														.last())
					.value();
		}).future<IPlugin[]>()();
	}

	private getPathToProjectPackageJson(): IFuture<string> {
		return (() => {
			return path.join(this.$project.getProjectDir().wait(), this.$projectConstants.PACKAGE_JSON_NAME);
		}).future<string>()();
	}

	private getProjectPackageJsonContent(): IFuture<any> {
		return ((): any => {
			let pathToPackageJson = this.getPathToProjectPackageJson().wait();

			if(!this.$fs.exists(pathToPackageJson).wait()) {
				this.$fs.copyFile(this.$nativeScriptResources.nativeScriptDefaultPackageJsonFile, pathToPackageJson).wait();
			}

			return this.$fs.readJson(pathToPackageJson).wait();
		}).future<any>()();
	}

	private getTopNpmPackages(count: number): IFuture<IPlugin[]> {
		return (() => {
			let plugins: IPlugin[];
			try {
				let url = `${NativeScriptProjectPluginsService.NPM_SEARCH_URL}/query?fields=name,version,rating,homepage,description,repository,author&sort=rating+desc&start=0&size=${count}`;
				let result = this.$httpClient.httpRequest(url).wait().body;
				if(result) {
					let npmSearchResult = JSON.parse(result).results;
					plugins =_.map(npmSearchResult, (pluginResult: any) => {
						if(pluginResult) {
							let pluginInfo: IPluginInfoBase = {
								Authors: pluginResult.author,
								Name: this.getStringFromNpmSearchResult(pluginResult, "name"),
								Identifier: this.getStringFromNpmSearchResult(pluginResult, "name"),
								Version: this.getStringFromNpmSearchResult(pluginResult, "version"),
								Url: this.getStringFromNpmSearchResult(pluginResult, "homepage"),
								Platforms: [],
								Description: this.getStringFromNpmSearchResult(pluginResult, "description"),
								SupportedVersion: ""
							};

							return new NativeScriptPluginData(pluginInfo, PluginType.NpmPlugin, this.$project);
						}

						return null;
					}).filter(pl => !!pl);
				}
			} catch(err) {
				this.$logger.trace("Unable to get top NPM packages.");
				this.$logger.trace(err);
			}

			return plugins;
		}).future<IPlugin[]>()();
	}

	private getStringFromNpmSearchResult(pluginResult: any, propertyName: string): string {
		if(pluginResult && pluginResult[propertyName] && pluginResult[propertyName].length){
			let item = _.first(pluginResult[propertyName]);
			if(item) {
				return item.toString();
			}
		}

		return "";
	}

	private getTopNativeScriptNpmPackages(count: number): IFuture<IPlugin[]> {
		return (() => {
			let currentPage = 0;
			let shouldBreak = false;
			let plugins: IPlugin[] = [];
			try {
				do {
					let nativescriptUrl = `${NativeScriptProjectPluginsService.NPM_SEARCH_URL}/query?fields=name,version,rating&sort=rating+desc&q=keywords:nativescript+NativeScript&start=${currentPage * count}&size=${count}`;
					let result = this.$httpClient.httpRequest(nativescriptUrl).wait().body;
					if(result) {
						let npmSearchResults: any[] = JSON.parse(result).results;
						shouldBreak = !npmSearchResults.length;
						let pluginFutures = _.map(npmSearchResults, pluginResult => this.getDataForNpmPackage(this.getStringFromNpmSearchResult(pluginResult, "name"), this.getStringFromNpmSearchResult(pluginResult, "version")));
						let allPlugins = getFuturesResults<IPlugin>(pluginFutures, pl => !!pl && !!pl.data && !!pl.data.Platforms && pl.data.Platforms.length > 0);
						plugins = plugins.concat(allPlugins.slice(0, count - plugins.length));
					} else {
						shouldBreak = true;
					}

					currentPage++;
				} while (plugins.length < count && !shouldBreak);
			} catch(err) {
				this.$logger.trace("Unable to get top NativeScript NPM packages.");
				this.$logger.trace(err);
				plugins = null;
			}

			return plugins;
		}).future<IPlugin[]>()();
	}

	private getDataForNpmPackage(packageName: string, version?: string): IFuture<IPlugin> {
		return ((): IPlugin => {
			try {
				let url = NativeScriptProjectPluginsService.buildNpmRegistryUrl(packageName, version || "latest");

				// This call will return error with message '{}' in case there's no such package.
				let result = this.$httpClient.httpRequest(url).wait().body;
				return this.constructNativeScriptPluginData(result).wait();
			} catch(err) {
				this.$logger.trace(`Unable to get data for npm package ${packageName} with version ${version}`, err);
			}

			return null;
		}).future<IPlugin>()();
	}

	private getDataForLocalPlugin(packageName: string, pathToPlugin?: string): IFuture<IPlugin> {
		return ((): IPlugin => {
			if(!!pathToPlugin.match(/^file:/)) {
				pathToPlugin = pathToPlugin.replace("file:", "");
			}

			if(this.checkIsValidLocalPlugin(pathToPlugin).wait()) {
				let fullPath = path.resolve(pathToPlugin);
				let packageJsonContent = this.$fs.readText(path.join(fullPath, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
				return this.constructNativeScriptPluginData(packageJsonContent).wait();
			}

			return null;
		}).future<IPlugin>()();
	}

	private getDataFromGitHubUrl(packageName: string, url?: string): IFuture<IPlugin> {
		return ((): IPlugin => {
			/* From `npm help install`:
			 * <protocol> is one of git, git+ssh, git+http, or git+https. If no <commit-ish> is specified, then master is used.
			 */
			if(!!url.match(/^(http|git)/)) {
				let pathToInstalledPackage = this.installPackageToTempDir(url).wait();
				if(pathToInstalledPackage) {
					let packageJsonContent = this.$fs.readText(path.join(pathToInstalledPackage, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
					return this.constructNativeScriptPluginData(packageJsonContent).wait();
				}
			}

			return null;
		}).future<IPlugin>()();
	}

	private constructNativeScriptPluginData(packageJsonContent: string): IFuture<NativeScriptPluginData> {
		return ((): NativeScriptPluginData => {
			let jsonResult = JSON.parse(packageJsonContent);
			let platforms: string[];
			let supportedVersion: string;
			let type = PluginType.NpmPlugin;
			if(jsonResult.nativescript && jsonResult.nativescript.platforms) {
				type = PluginType.NpmNativeScriptPlugin;
				platforms = _.keys(jsonResult.nativescript.platforms);
				supportedVersion = semver.maxSatisfying(_.values(jsonResult.nativescript.platforms), ">=0.0.0");
			}

			let data: IPluginInfoBase = {
				Authors: jsonResult.author ? [jsonResult.author.name] : null,
				Name: jsonResult.name,
				Identifier: jsonResult.name,
				Version: jsonResult.version,
				Url: jsonResult.repository.url || jsonResult.homepage,
				Platforms: platforms,
				Description: jsonResult.description,
				SupportedVersion: supportedVersion
			};

			return new NativeScriptPluginData(data, type, this.$project);
		}).future<NativeScriptPluginData>()();
	}

	private checkIsValidLocalPlugin(pluginName: string): IFuture<boolean> {
		return ((): boolean => {
			let fullPath = path.resolve(pluginName);

			return this.$fs.exists(fullPath).wait() && this.$fs.exists(path.join(fullPath, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
		}).future<boolean>()();
	}

	private installLocalPlugin(pluginPath: string): IFuture<void> {
		return (() => {
			let pathToPlugin = path.resolve(pluginPath);
			let content = this.$fs.readJson(path.join(pathToPlugin, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
			let name = content.name;

			// In case the plugin is not part of the project or it is under node_modules, copy it to plugins
			if(pathToPlugin.indexOf(this.$project.getProjectDir().wait()) === -1 || pathToPlugin.indexOf(NativeScriptProjectPluginsService.NODE_MODULES_DIR_NAME) !== -1) {
				let pathToInstall = path.join(this.$project.getProjectDir().wait(), "plugins");
				this.$logger.printMarkdown(util.format("Copying `%s` directory to `%s` in order to be able to use the plugin in your project.", pathToPlugin, pathToInstall));
				shelljs.cp("-Rf", pathToPlugin, pathToInstall);
				pathToPlugin = path.join(pathToInstall, path.basename(pathToPlugin));
			}

			let pathToPackageJson = this.getPathToProjectPackageJson().wait();
			let packageJsonContent = this.getProjectPackageJsonContent().wait();

			packageJsonContent.dependencies[name] = `file:${path.relative(this.$project.getProjectDir().wait(), pathToPlugin)}`;
			this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();
			this.$logger.printMarkdown(util.format("Successfully added plugin `%s`.", name));
		}).future<void>()();
	}

	private findPluginsByName(name: string): IFuture<IBasicPluginInformation[]> {
		return (() => {
			let nativescriptUrl = `${NativeScriptProjectPluginsService.NPM_SEARCH_URL}/query?fields=name,version,description&sort=rating+desc&q=name:"${encodeURIComponent(name)}"&start=0&size=10000`;
			let result = this.$httpClient.httpRequest(nativescriptUrl).wait().body;
			if(result) {
				let npmSearchResult: any[] = JSON.parse(result).results;
				let plugins =_.map(npmSearchResult, pluginResult => {
					let pluginInfo: IBasicPluginInformation = {
						name: this.getStringFromNpmSearchResult(pluginResult, "name"),
						version: this.getStringFromNpmSearchResult(pluginResult, "version"),
						description: this.getStringFromNpmSearchResult(pluginResult, "description")
					};
					return pluginInfo;
				});

				return plugins;
			}
			return null;
		}).future<IBasicPluginInformation[]>()();
	}

	private installPackageToTempDir(identifier: string): IFuture<string> {
		return ((): string => {
			let tempInstallDir = temp.mkdirSync("nativeScriptPluginInstallation");
			let pathToInstalledPlugin: string;
			try {
				let npmInstallOutput = this.$childProcess.exec(`npm install ${identifier} --production --ignore-scripts`, {cwd: tempInstallDir}).wait();
				let pathToPackage = path.join(tempInstallDir, NativeScriptProjectPluginsService.NODE_MODULES_DIR_NAME);
				// output is something like: nativescript-google-sdk@0.1.18 node_modules\nativescript-google-sdk\n
				let npmOutputMatch = npmInstallOutput.match(/.*?@.*?\s+?(.*?node_modules.*?)\r?\n?$/m);
				if(npmOutputMatch) {
					pathToInstalledPlugin = path.join(tempInstallDir, npmOutputMatch[1]);
				} else if(this.$fs.exists(pathToPackage).wait()) {
					// In new npm versions output has different format
					// Most probably the package is installed inside node_modules dir in temp folder.
					let dirs = this.$fs.readDirectory(pathToPackage).wait().filter(dirName => dirName !== ".bin");
					if(dirs.length === 1) {
						pathToInstalledPlugin = path.join(pathToPackage, _.first(dirs));
					}
				}
			} catch (err) {
				this.$logger.trace(err);
			}

			return pathToInstalledPlugin;
		}).future<string>()();
	}

	private getPackageJsonFromNpmRegistry(packageName: string, version: string): IFuture<any> {
		return (() => {
			let packageJsonContent: any;
			try {
				let url = NativeScriptProjectPluginsService.buildNpmRegistryUrl(packageName, version);
				// This call will return error with message '{}' in case there's no such package.
				let result = this.$httpClient.httpRequest(url).wait().body;
				packageJsonContent = JSON.parse(result);
			} catch(err) {
				this.$logger.trace("Error caught while checking the NPM Registry for plugin with id: %s", packageName);
				this.$logger.trace(err);
			}

			return packageJsonContent;
		}).future<any>()();
	}

	private getBasicPluginInfoFromMarketplace(pluginName: string, version: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let basicInfo: IBasicPluginInformation;
			let allMarketplacePlugins = this.getMarketplacePlugins().wait();
			let marketPlacePlugins: IPlugin[] = _.filter(allMarketplacePlugins, pl => pl.data.Identifier.toLowerCase() === pluginName.toLowerCase());
			if(marketPlacePlugins && marketPlacePlugins.length) {
				let selectedPlugin = version === "latest" ? _.last(_.sortBy(marketPlacePlugins, pl => pl.data.Version)) :
															_.find(marketPlacePlugins, pl => version.toLowerCase() === pl.data.Version.toLowerCase());

				if (selectedPlugin) {
					basicInfo = {
						name: selectedPlugin.data.Name,
						version: selectedPlugin.data.Version
					};

					if(!semver.satisfies(this.$project.projectData.FrameworkVersion, selectedPlugin.data.SupportedVersion)) {
						this.$errors.failWithoutHelp(`Plugin ${pluginName} requires at least version ${selectedPlugin.data.SupportedVersion}, but your project targets ${this.$project.projectData.FrameworkVersion}.`);
					}
				}
			}

			return basicInfo;
		}).future<IBasicPluginInformation>()();
	}

	private getBasicPluginInfoFromNpm(name: string, version: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let basicInfo: IBasicPluginInformation;
			let jsonInfo = this.getPackageJsonFromNpmRegistry(name, version).wait();
			if(jsonInfo) {
				basicInfo = {
					name: jsonInfo.name,
					version: jsonInfo.version
				};

				if(jsonInfo.nativescript && jsonInfo.nativescript.platforms) {
					let matchingVersion = semver.maxSatisfying(_.values(jsonInfo.nativescript.platforms), `>=${this.$project.projectData.FrameworkVersion}`);
					if(matchingVersion) {
						this.$errors.failWithoutHelp(`Plugin ${name} requires newer version of NativeScript, your project targets ${this.$project.projectData.FrameworkVersion}.`);
					}
				}
			}

			return basicInfo;
		}).future<IBasicPluginInformation>()();
	}

	private getBasicPluginInfoFromUrl(url: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let basicInfo: IBasicPluginInformation;

			/* From `npm help install`:
			 * <protocol> is one of git, git+ssh, git+http, or git+https. If no <commit-ish> is specified, then master is used.
			 */
			if(!!url.match(/^(http|git)/)) {
				let pathToInstalledPackage = this.installPackageToTempDir(url).wait();
				if(pathToInstalledPackage) {
					let packageJson = this.$fs.readJson(path.join(pathToInstalledPackage, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
					basicInfo = {
						name: packageJson.name,
						version: url
					};
				}
			}

			return basicInfo;
		}).future<IBasicPluginInformation>()();
	}

	private static buildNpmRegistryUrl(packageName: string, version: string): string {
		return `${NativeScriptProjectPluginsService.NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}?version=${encodeURIComponent(version)}`;
	}
}
$injector.register("nativeScriptProjectPluginsService", NativeScriptProjectPluginsService);

export enum PluginType {
	NpmPlugin = 0,
	NpmNativeScriptPlugin = 1,
	MarketplacePlugin = 2
}

export class NativeScriptPluginData implements IPlugin {
	public configurations: string[];

	constructor(public data: IPluginInfoBase,
		public type: PluginType,
		protected $project: Project.IProject) {
		this.configurations = [];
	}

	public get pluginInformation(): string[] {
		let additionalPluginData: string[];
		if(this.data.Platforms && this.data.Platforms.length > 0) {
			additionalPluginData = [this.buildRow("Platforms", this.data.Platforms.join(", "))];
		}
		return this.composePluginInformation(additionalPluginData);
	}

	public toProjectDataRecord(version: string): string {
		return `"${this.data.Name}": "${version}"`;
	}

	protected buildRow(key: string, value: string): string {
		return util.format("    %s: %s", key, value);
	}

	protected composePluginInformation(additionalPluginData: string[]): string[] {
		let result = _.flatten<string>([this.getBasicPluginInformation(), additionalPluginData]);
		return result;
	}

	private getBasicPluginInformation(): string[] {
		let nameRow = this.buildRow("Plugin", this.data.Name);
		let versionRow = this.buildRow("Version", this.data.Version);
		let urlRow = this.buildRow("Url", this.data.Url);

		let result = [nameRow, versionRow, urlRow];

		if(this.data.Authors) {
			result.push(this.buildRow("Authors", this.data.Authors.join(", ")));
		}

		if(this.data.SupportedVersion) {
			let supportedVersion = this.buildRow("Supported Version", this.data.SupportedVersion);
			result.push(supportedVersion);
		}

		if(this.configurations && this.configurations.length > 0) {
			result.push(util.format("    Configuration: %s", this.configurations.join(", ")));
		}

		return result;
	}
}

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
import { isInteractive } from "../common/helpers";
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
		private $projectConstants: Project.IConstants,
		private $pluginVariablesHelper: IPluginVariablesHelper,
		private $prompter: IPrompter,
		private $server: Server.IServer) {
			let versions: string[] = (<any[]>this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile).wait().versions).map(version => version.version);
			let frameworkVersion = this.$project.projectData.FrameworkVersion;
			if(!_.contains(versions, frameworkVersion)) {
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
			let pluginBasicInfo: IBasicPluginInformation;
			if(this.isPluginInstalled(pluginIdentifier)) {
				this.$logger.printMarkdown(util.format("Plugin `%s` is already installed.", pluginIdentifier));
				return;
			}

			if (NativeScriptProjectPluginsService.hasTgzExtension(pluginIdentifier)) {
				pluginBasicInfo = this.fetchPluginBasicInformation(path.resolve(pluginIdentifier), "add", { isTgz: true }).wait();
			} else if(this.checkIsValidLocalPlugin(pluginIdentifier).wait()) {
				pluginBasicInfo = this.installLocalPlugin(pluginIdentifier, {addPluginToPackageJson: true}).wait();
			} else {
				pluginBasicInfo = this.setPluginInPackageJson(pluginIdentifier, {addPluginToPackageJson: true}).wait();
			}

			this.$logger.printMarkdown(util.format("Successfully added plugin `%s`.", pluginBasicInfo.name));
		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			let pathToPackageJson = this.getPathToProjectPackageJson().wait();
			let packageJsonContent = this.getProjectPackageJsonContent().wait();
			let pluginBasicInfo = this.getPluginBasicInformation(pluginName).wait();
			if(packageJsonContent.dependencies[pluginBasicInfo.name]) {
				let pathToPlugin = packageJsonContent.dependencies[pluginBasicInfo.name].toString().replace("file:","");
				if(this.checkIsValidLocalPlugin(pathToPlugin).wait()) {
					this.$fs.deleteDirectory(path.resolve(pathToPlugin)).wait();
				}
				delete packageJsonContent.dependencies[pluginBasicInfo.name];
				if(packageJsonContent.nativescript) {
					delete packageJsonContent.nativescript[`${pluginBasicInfo.name}-variables`];
				}
				this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();

				this.$logger.printMarkdown(util.format("Successfully removed plugin `%s`.", pluginBasicInfo.name));
			} else {
				this.$logger.printMarkdown(util.format("Plugin `%s` is not installed.", pluginBasicInfo.name));
			}
		}).future<void>()();
	}

	public configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void> {
		return (() => {
			let basicPluginInfo = this.getPluginBasicInformation(pluginName).wait(),
				packageJsonContent = this.getProjectPackageJsonContent().wait(),
				dependencies = _.keys(packageJsonContent.dependencies);

			if(!_.any(dependencies, d => d === basicPluginInfo.name)) {
				this.$errors.failWithoutHelp(`Plugin ${pluginName} is not installed.`);
			}

			let pluginVersion = packageJsonContent.dependencies[basicPluginInfo.name].replace("file:", "");
			if(this.checkIsValidLocalPlugin(pluginVersion).wait()) {
				this.installLocalPlugin(pluginVersion).wait();
			} else {
				this.setPluginInPackageJson(pluginName).wait();
			}

			this.$logger.printMarkdown(util.format("Successfully configured plugin `%s`.", basicPluginInfo.name));
		}).future<void>()();
	}

	public isPluginInstalled(pluginName: string): boolean {
		let packageJsonContent = this.getProjectPackageJsonContent().wait();
		let pluginBasicInfo = this.getPluginBasicInformation(pluginName).wait();
		return packageJsonContent
				&& !!packageJsonContent.dependencies && !!packageJsonContent.dependencies[pluginBasicInfo.name]
				&& (!pluginBasicInfo.version || packageJsonContent.dependencies[pluginBasicInfo.name] === pluginBasicInfo.version);
	}

	public getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let [ name, version ] = pluginName.split("@");
			version = version || "latest";
			return this.getBasicPluginInfoFromMarketplace(name, version).wait() || { name, version };
		}).future<IBasicPluginInformation>()();
	}

	public fetch(pluginIdentifier: string): IFuture<void> {
		return (() => {
			let pluginLocalPath = path.resolve(pluginIdentifier),
				pluginLocalPathExists = this.$fs.exists(pluginLocalPath).wait(),
				suppressMessage = pluginLocalPathExists && (pluginLocalPath.indexOf(this.$project.getProjectDir().wait()) === -1 || pluginLocalPath.indexOf(NativeScriptProjectPluginsService.NODE_MODULES_DIR_NAME) !== -1);

			let pluginBasicInfo = this.fetchPluginBasicInformation(pluginLocalPathExists ? pluginLocalPath : pluginIdentifier, "fetch", { surpressMessage: !suppressMessage }).wait();
			this.$logger.printMarkdown(util.format("Successfully fetched plugin `%s`.", pluginBasicInfo.name));
		}).future<void>()();
	}

	public filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]> {
		return Future.fromResult(plugins);
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

	private fetchPluginBasicInformation(pluginIdentifier: string, failMessageMethodName: string,  opts?: { isTgz?: boolean, surpressMessage?: boolean }): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			if(!pluginIdentifier) {
				this.$errors.fail("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the NPM.");
			}
			let isTgz = opts && opts.isTgz || NativeScriptProjectPluginsService.hasTgzExtension(pluginIdentifier);

			if (isTgz) {
				pluginIdentifier = path.resolve(pluginIdentifier);
			}

			let pathToInstalledPlugin = this.installPackageToTempDir(pluginIdentifier).wait(),
				actualPlugin: string,
				installLocalPluginOptions: any = {
					addPluginToPackageJson: true,
					surpressMessage: opts && opts.surpressMessage
				};

			if (pathToInstalledPlugin) {
				if (isTgz || this.$fs.exists(pluginIdentifier).wait()) {
					actualPlugin = pluginIdentifier;
					installLocalPluginOptions["packageJsonContents"] = this.$fs.readJson(path.join(pathToInstalledPlugin, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
				} else {
					actualPlugin = pathToInstalledPlugin;
				}

				return this.installLocalPlugin(actualPlugin, installLocalPluginOptions).wait();
			} else {
				let errorMessage =`Unable to ${failMessageMethodName} plugin ${pluginIdentifier}.` +
					" Make sure this is a valid plugin name, path to existing directory or git URL.";
				this.$errors.failWithoutHelp(errorMessage);
			}
		}).future<IBasicPluginInformation>()();
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
							pluginInfo.Variables = this.getPluginVariablesInfoFromNpm(pluginInfo.Name, pluginInfo.Version).wait() || [];

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
				version = version || "latest";
				let url = NativeScriptProjectPluginsService.buildNpmRegistryUrl(packageName, version);

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
				Url: (jsonResult.repository && jsonResult.repository.url) || jsonResult.homepage || '',
				Platforms: platforms,
				Description: jsonResult.description,
				SupportedVersion: supportedVersion,
				Variables: jsonResult.nativescript && jsonResult.nativescript.variables
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

	private installLocalPlugin(pluginPath: string, pluginOpts?: {addPluginToPackageJson: boolean, packageJsonContents?: any, surpressMessage?: boolean}): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let pathToPlugin = path.resolve(pluginPath),
				content = pluginOpts && pluginOpts.packageJsonContents || this.$fs.readJson(path.join(pathToPlugin, this.$projectConstants.PACKAGE_JSON_NAME)).wait(),
				name = content.name;

			// In case the plugin is not part of the project or it is under node_modules, copy it to plugins
			if(pathToPlugin.indexOf(this.$project.getProjectDir().wait()) === -1 || pathToPlugin.indexOf(NativeScriptProjectPluginsService.NODE_MODULES_DIR_NAME) !== -1) {
				let pathToInstall = path.join(this.$project.getProjectDir().wait(), "plugins");
				if (!pluginOpts || !pluginOpts.surpressMessage) {
					this.$logger.printMarkdown(util.format("Copying `%s` to `%s` in order to be able to use the plugin in your project.", pathToPlugin, pathToInstall));
				}
				// use cp instead of mv, as it would fail if pathToInstalledPlugin is mounted
				// on a different device from the pluginsPath with error:
				// Error: EXDEV, cross-device link not permitted
				shelljs.cp("-Rf", pathToPlugin, pathToInstall);
				pathToPlugin = path.join(pathToInstall, path.basename(pathToPlugin));
			}

			let pathToPackageJson = this.getPathToProjectPackageJson().wait();
			let packageJsonContent = this.getProjectPackageJsonContent().wait();

			if(pluginOpts && pluginOpts.addPluginToPackageJson) {
				packageJsonContent.dependencies[name] = `file:${path.relative(this.$project.getProjectDir().wait(), pathToPlugin)}`;
			}

			let basicPluginInfo: IBasicPluginInformation = {
				name: name,
				version: content.version,
				variables: content.nativescript && content.nativescript.variables
			};

			packageJsonContent = this.setPluginVariables(packageJsonContent, basicPluginInfo).wait();
			this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();
			return basicPluginInfo;
		}).future<IBasicPluginInformation>()();
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
			try {
				// Create package.json in the temp directory in order to be sure that the package will be installed inside <temp_dir>/node_modules
				let packageJsonData = {
					name:"tempPackage",
					version: "1.0.0"
				};
				this.$fs.writeJson(path.join(tempInstallDir, this.$projectConstants.PACKAGE_JSON_NAME), packageJsonData).wait();

				let npmInstallOutput = this.$childProcess.exec(`npm install ${identifier} --production --ignore-scripts`, {cwd: tempInstallDir}).wait();
				let pathToPackage = path.join(tempInstallDir, NativeScriptProjectPluginsService.NODE_MODULES_DIR_NAME);

				if(this.$fs.exists(pathToPackage).wait()) {
					// Most probably the package is installed inside node_modules dir in temp folder.
					let dirs = this.$fs.readDirectory(pathToPackage).wait().filter(dirName => dirName !== ".bin");
					// In case npm3 is installed on user's machine and the package has dependencies, there will be more than one dir, so we cannot be sure which one is ours.
					if(dirs.length === 1) {
						return path.join(pathToPackage, _.first(dirs));
					}
				}

				// output is something like: tempPackage@1.0.0 C:\Users\VLADIM~1\AppData\Local\Temp\1\nativeScriptPluginInstallation116013-39060-jpwbm9
				//                           └── plugin-var-plugin@1.0.0  extraneous
				let npm2OutputMatch = npmInstallOutput.match(/.*?tempPackage@1\.0\.0.*?\r?\n.*?\s+?(.*?)@.*?\s+?/m);
				if(npm2OutputMatch) {
					return path.join(tempInstallDir, NativeScriptProjectPluginsService.NODE_MODULES_DIR_NAME, npm2OutputMatch[1]);
				}

				// output is something like: nativescript-google-sdk@0.1.18 node_modules\nativescript-google-sdk\n
				let npmOutputMatch = npmInstallOutput.match(/.*?@.*?\s+?(.*?node_modules.*?)\r?\n?$/m);
				if(npmOutputMatch) {
					return path.join(tempInstallDir, npmOutputMatch[1]);
				}
			} catch (err) {
				this.$logger.trace(err);
			}

			return null;
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
				this.$logger.trace(err.message);
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
						name: selectedPlugin.data.Identifier,
						version: selectedPlugin.data.Version
					};

					// TODO: Use variables from server when it returns them to us.
					basicInfo.variables = this.getPluginVariablesInfoFromNpm(basicInfo.name, basicInfo.version).wait();
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
					version: jsonInfo.version,
					variables: jsonInfo.nativescript && jsonInfo.nativescript.variables
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

	private getPluginVariablesInfoFromNpm(name: string, version: string): IFuture<any> {
		return ((): any => {
			let jsonInfo = this.getPackageJsonFromNpmRegistry(name, version).wait();
			return jsonInfo && jsonInfo.nativescript && jsonInfo.nativescript.variables;
		}).future<any>()();
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
						version: url,
						variables: packageJson.nativescript && packageJson.nativescript.variables
					};
				}
			}

			return basicInfo;
		}).future<IBasicPluginInformation>()();
	}

	private setPluginInPackageJson(pluginIdentifier: string, pluginOpts?: {addPluginToPackageJson: boolean}): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let pathToPackageJson = this.getPathToProjectPackageJson().wait(),
				packageJsonContent = this.getProjectPackageJsonContent().wait(),
				pluginBasicInfo = this.getPluginBasicInformation(pluginIdentifier).wait(),
				name = pluginBasicInfo.name,
				selectedVersion = pluginBasicInfo.version || "latest",
				basicPlugin = this.getBasicPluginInfoFromMarketplace(name, selectedVersion).wait() ||
								this.getBasicPluginInfoFromNpm(name, selectedVersion).wait() ||
								this.getBasicPluginInfoFromUrl(pluginIdentifier).wait();

			if(!basicPlugin) {
				this.$errors.failWithoutHelp(`Unable to add plugin ${pluginIdentifier}. Make sure you've provided a valid name, path to local directory or git URL.`);
			}

			if(pluginOpts && pluginOpts.addPluginToPackageJson) {
				packageJsonContent.dependencies[basicPlugin.name] = basicPlugin.version;
			}
			if(basicPlugin.variables) {
				packageJsonContent = this.setPluginVariables(packageJsonContent, basicPlugin).wait();
			}

			this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();
			return basicPlugin;
		}).future<IBasicPluginInformation>()();
	}

	private setPluginVariables(packageJsonContent: any, basicPlugin: IBasicPluginInformation): IFuture<any> {
		return ((): any => {
			let variablesInformation = basicPlugin.variables;
			if(variablesInformation && _.keys(variablesInformation).length) {
				this.$logger.trace(`Plugin ${basicPlugin.name}@${basicPlugin.version} describes the following plugin variables:`);
				this.$logger.trace(variablesInformation);
				packageJsonContent.nativescript = packageJsonContent.nativescript || {};
				let pluginVariableNameInPackageJson = `${basicPlugin.name}-variables`;
				let currentVariablesValues = packageJsonContent.nativescript[pluginVariableNameInPackageJson] || {};
				let newObj: IStringDictionary = Object.create(null);
				_.each(variablesInformation, (variableInfo: any, variableName: string) => {
					let currentValue = currentVariablesValues[variableName] || variableInfo.defaultValue;
					newObj[variableName] = this.gatherVariableInformation(variableName, currentValue).wait()[variableName];
				});

				delete packageJsonContent.nativescript[pluginVariableNameInPackageJson];
				if(_.keys(newObj).length) {
					packageJsonContent.nativescript[pluginVariableNameInPackageJson] = newObj;
				}
			}

			return packageJsonContent;
		}).future<any>()();
	}

	private gatherVariableInformation(variableName: string, defaultValue: any): IFuture<any> {
		return (() => {
			let schema: IPromptSchema = {
				name: variableName,
				type: "input",
				message: `Set value for variable ${variableName}`,
				validate: (val: string) => !!val ? true : 'Please enter a value!'
			};

			if(defaultValue) {
				schema.default = () => defaultValue;;
			}

			let fromVarOpion = this.$pluginVariablesHelper.getPluginVariableFromVarOption(variableName);
			if(!isInteractive() && !fromVarOpion) {
				if(defaultValue) {
					this.$logger.trace(`Console is not interactive, so default value for ${variableName} will be used: ${defaultValue}.`);
					let defaultObj: any = Object.create(null);
					defaultObj[variableName] = defaultValue;
					return defaultObj;
				}
				this.$errors.failWithoutHelp(`Unable to find value for ${variableName} plugin variable. Ensure the --var option is specified or the plugin variable has default value.`);
			}

			return fromVarOpion || this.$prompter.get([schema]).wait();
		}).future<any>()();
	}

	private static buildNpmRegistryUrl(packageName: string, version: string): string {
		return `${NativeScriptProjectPluginsService.NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}?version=${encodeURIComponent(version)}`;
	}

	private static hasTgzExtension(pluginidentifier: string): boolean {
		let pluginIdentifierExtname = path.extname(pluginidentifier);
		return pluginIdentifierExtname === ".tgz" || pluginIdentifierExtname === ".gz";
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

		if(this.data.Variables && _.keys(this.data.Variables).length) {
			let varInfo = this.$project.getPluginVariablesInfo().wait();
			if(varInfo && varInfo[this.data.Identifier]) {
				result.push("    Variables:");
				_.each(varInfo[this.data.Identifier], (variableValue: any, variableName:string) => {
					result.push(`        ${variableName}: ${variableValue}`);
				});
			} else {
				let variables = _.keys(this.data.Variables).join(", ");
				result.push(`    Variables: ${variables}`);
			}
		}

		return result;
	}
}

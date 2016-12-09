import * as path from "path";
import * as util from "util";
import * as semver from "semver";
import {EOL} from "os";
import {getFuturesResults} from "../../common/helpers";
import {MarketplacePluginData} from "../../plugins-data";
import {isInteractive} from "../../common/helpers";
import {NODE_MODULES_DIR_NAME} from "../../common/constants";
import {PluginsServiceBase} from "./plugins-service-base";
import Future = require("fibers/future");
import temp = require("temp");
temp.track();

export class NativeScriptProjectPluginsService extends PluginsServiceBase implements IPluginsService {
	private static NPM_SEARCH_URL = "http://npmsearch.com";
	private static HEADERS = ["NPM Packages", "NPM NativeScript Plugins", "Marketplace Plugins", "Advanced Plugins"];
	private static DEFAULT_NUMBER_OF_NPM_PACKAGES = 10;
	private static NATIVESCRIPT_LIVEPATCH_PLUGIN_ID = "nativescript-plugin-livepatch";

	private featuredNpmPackages = [NativeScriptProjectPluginsService.NATIVESCRIPT_LIVEPATCH_PLUGIN_ID];
	private marketplacePlugins: IPlugin[];

	constructor(private $nativeScriptResources: INativeScriptResources,
		private $typeScriptService: ITypeScriptService,
		private $pluginVariablesHelper: IPluginVariablesHelper,
		private $projectMigrationService: Project.IProjectMigrationService,
		private $server: Server.IServer,
		$errors: IErrors,
		$logger: ILogger,
		$prompter: IPrompter,
		$fs: IFileSystem,
		$project: Project.IProject,
		$projectConstants: Project.IConstants,
		$childProcess: IChildProcess,
		$httpClient: Server.IHttpClient,
		$options: IOptions,
		$npmService: INpmService,
		$hostInfo: IHostInfo,
		$npmPluginsService: INpmPluginsService) {
		super($errors, $logger, $prompter, $fs, $project, $projectConstants, $childProcess, $httpClient, $options, $npmService, $hostInfo, $npmPluginsService);
		let versions: string[] = (<any[]>this.$fs.readJson(this.$nativeScriptResources.nativeScriptMigrationFile).wait().supportedVersions).map(version => version.version);
		let frameworkVersion = this.$project.projectData.FrameworkVersion;
		if (!_.includes(versions, frameworkVersion)) {
			this.$errors.failWithoutHelp(`Your project targets NativeScript version '${frameworkVersion}' which does not support plugins.`);
		}

		this.$projectMigrationService.migrateTypeScriptProject().wait();
	}

	public getAvailablePlugins(pluginsCount?: number): IPlugin[] {
		let count = pluginsCount || NativeScriptProjectPluginsService.DEFAULT_NUMBER_OF_NPM_PACKAGES;
		let futures = [
			this.getUniqueMarketplacePlugins(),
			this.getTopNpmPackages(count),
			this.getTopNativeScriptNpmPackages(count),
			this.getFeaturedNpmPackages()
		];

		return getFuturesResults<IPlugin>(futures, res => !!res);
	}

	public getInstalledPlugins(): IPlugin[] {
		let pathToPackageJson = this.getPathToProjectPackageJson();

		if (this.$fs.exists(pathToPackageJson)) {
			let content = this.$fs.readJson(pathToPackageJson).wait();
			if (content && content.dependencies) {
				let items = _.map(content.dependencies, (version: string, name: string) => {
					let marketplacePlugin = _.find(this.getMarketplacePlugins().wait(), pl => pl.data.Name === name && pl.data.Version === version);
					let plugin = marketplacePlugin || this.getDataForNpmPackage(name, version).wait()
						|| this.getDataForLocalPlugin(name, version).wait()
						|| this.getDataFromGitHubUrl(name, version).wait();
					if (!plugin) {
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
		let outputLines: string[] = [];

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
			if (this.isPluginInstalled(pluginIdentifier)) {
				this.$logger.printMarkdown(util.format("Plugin `%s` is already installed.", pluginIdentifier));
				return;
			}

			if (this.hasTgzExtension(pluginIdentifier)) {
				pluginBasicInfo = this.fetchPluginBasicInformation(path.resolve(pluginIdentifier), "add", null, { actualName: pluginIdentifier, isTgz: true, addPluginToConfigFile: false }).wait();
			} else if (this.checkIsValidLocalPlugin(pluginIdentifier).wait()) {
				pluginBasicInfo = this.installLocalPlugin(pluginIdentifier, { actualName: pluginIdentifier, isTgz: false, addPluginToConfigFile: true }).wait();
			} else {
				pluginBasicInfo = this.setPluginInPackageJson(pluginIdentifier, { addPluginToPackageJson: true }).wait();
			}

			if (this.$typeScriptService.isTypeScriptProject(this.$project.projectDir).wait()) {
				// Do not pass version here, we've already added the entry in package.json, so the correct version will be installed anyway.
				let installResult = this.$npmService.install(this.$project.projectDir, { installTypes: this.$options.types, name: pluginBasicInfo.name }).wait();
				if (installResult.error) {
					this.$errors.failWithoutHelp(`Error while installing dependency: ${installResult.error.message}.`);
				}
			}

			this.$logger.printMarkdown(util.format("Successfully added plugin `%s`.", pluginBasicInfo.name));
		}).future<void>()();
	}

	public removePlugin(pluginName: string): IFuture<void> {
		return (() => {
			let pathToPackageJson = this.getPathToProjectPackageJson();
			let packageJsonContent = this.getProjectPackageJsonContent().wait();
			let pluginBasicInfo = this.getPluginBasicInformation(pluginName).wait();
			if (packageJsonContent.dependencies[pluginBasicInfo.name]) {
				let pathToPlugin = packageJsonContent.dependencies[pluginBasicInfo.name].toString().replace("file:", "");

				let fullPluginPath = path.join(this.$project.projectDir, pathToPlugin);

				if (this.checkIsValidLocalPlugin(pathToPlugin).wait() || (this.hasTgzExtension(fullPluginPath) && this.isPluginPartOfTheProject(fullPluginPath))) {
					this.$fs.deleteDirectory(fullPluginPath);
				}

				if (packageJsonContent.nativescript) {
					delete packageJsonContent.nativescript[`${pluginBasicInfo.name}-variables`];
				}

				this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();

				this.$npmService.uninstall(this.$project.projectDir, pluginBasicInfo.name).wait();

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

			if (!_.some(dependencies, d => d === basicPluginInfo.name)) {
				this.$errors.failWithoutHelp(`Plugin ${pluginName} is not installed.`);
			}

			let pluginVersion = packageJsonContent.dependencies[basicPluginInfo.name].replace("file:", "");
			if (this.checkIsValidLocalPlugin(pluginVersion).wait()) {
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
		return (packageJsonContent
			&& !!packageJsonContent.dependencies && !!packageJsonContent.dependencies[pluginBasicInfo.name]
			&& (!pluginBasicInfo.version || packageJsonContent.dependencies[pluginBasicInfo.name] === pluginBasicInfo.version) || this.isPluginFetched(pluginName).wait());
	}

	public getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let dependencyInfo = this.$npmService.getDependencyInformation(pluginName);
			return this.getBasicPluginInfoFromMarketplace(dependencyInfo.name, dependencyInfo.version).wait() || { name: dependencyInfo.name, version: dependencyInfo.version };
		}).future<IBasicPluginInformation>()();
	}

	public filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]> {
		return Future.fromResult(plugins);
	}

	protected getCopyLocalPluginData(pathToPlugin: string): NpmPlugins.ICopyLocalPluginData {
		// We need this check because for NS projects we do not extract the tgz.
		if (this.hasTgzExtension(pathToPlugin)) {
			return {
				sourceDirectory: pathToPlugin,
				destinationDirectory: path.join(this.$project.getProjectDir(), "plugins")
			};
		} else {
			return super.getCopyLocalPluginData(pathToPlugin);
		}
	}

	protected getPluginsDirName(): string {
		return NODE_MODULES_DIR_NAME;
	}

	protected composeSearchQuery(keywords: string[]): string[] {
		return keywords;
	}

	protected installLocalPluginCore(pathToPlugin: string, pluginData: ILocalPluginData): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let content = pluginData && pluginData.configFileContents || this.$fs.readJson(path.join(pathToPlugin, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
			let name = content.name;
			let basicPluginInfo: IBasicPluginInformation = {
				name: name,
				version: content.version,
				variables: content.nativescript && content.nativescript.variables
			};

			let pathToPackageJson = this.getPathToProjectPackageJson();
			let packageJsonContent = this.getProjectPackageJsonContent().wait();
			if (pluginData && pluginData.addPluginToConfigFile) {
				packageJsonContent.dependencies[name] = "file:" + path.relative(this.$project.getProjectDir(), pathToPlugin);
			}

			// Skip variables configuration for AppManager LiveSync Plugin.
			if (name !== NativeScriptProjectPluginsService.NATIVESCRIPT_LIVEPATCH_PLUGIN_ID) {
				packageJsonContent = this.setPluginVariables(packageJsonContent, basicPluginInfo).wait();
			}

			this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();

			return basicPluginInfo;
		}).future<IBasicPluginInformation>()();
	}

	protected fetchPluginBasicInformationCore(pathToInstalledPlugin: string, version: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation> {
		if (pluginData && pluginData.isTgz || this.$fs.exists(pluginData.actualName)) {
			pluginData.configFileContents = this.$fs.readJson(path.join(pathToInstalledPlugin, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
		}

		// Need to set addPluginToConfigFile to true when fetching NativeScript plugins.
		pluginData.addPluginToConfigFile = true;

		// Pass the actual plugin name because we do not need to add the extracted plugin if it is tgz file.
		return super.installLocalPlugin(pluginData && pluginData.isTgz ? pluginData.actualName : pathToInstalledPlugin, pluginData, options);
	}

	protected shouldCopyToPluginsDirectory(pathToPlugin: string): boolean {
		return super.shouldCopyToPluginsDirectory(pathToPlugin) || pathToPlugin.indexOf(this.getPluginsDirName()) !== -1;
	}

	// TODO: Remove IFuture, reason: fs.exists - not available at the moment
	// Remark: Cannot do it until cordova-project-plugins-service has async call.
	protected validatePluginInformation(pathToPlugin: string): IFuture<void> {
		return (() => {
			if (!this.$fs.exists(path.join(pathToPlugin, this.$projectConstants.PACKAGE_JSON_NAME))) {
				this.$errors.failWithoutHelp(`${path.basename(pathToPlugin)} is not a valid NativeScript plugin.`);
			}
		}).future<void>()();
	}

	private getMarketplacePlugins(): IFuture<IPlugin[]> {
		return ((): IPlugin[] => {
			if (!this.marketplacePlugins || !this.marketplacePlugins.length) {
				try {
					let plugins = this.$server.nativescript.getMarketplacePluginVersionsData().wait();
					this.marketplacePlugins = [];
					_.each(plugins, plugin => {
						let versions = _.map(plugin.Versions, (pluginVersionData) =>
							new MarketplacePluginData(<any>plugin, <any>pluginVersionData, this.$project, this.$projectConstants));
						this.marketplacePlugins = this.marketplacePlugins.concat(versions);
					});
				} catch (err) {
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

	private getPathToProjectPackageJson(): string {
		return path.join(this.$project.getProjectDir(), this.$projectConstants.PACKAGE_JSON_NAME);
	}

	private getProjectPackageJsonContent(): IFuture<any> {
		return ((): any => {
			let pathToPackageJson = this.getPathToProjectPackageJson();

			if (!this.$fs.exists(pathToPackageJson)) {
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
				if (result) {
					let npmSearchResult = JSON.parse(result).results;
					plugins = _.map(npmSearchResult, (pluginResult: any) => {
						if (pluginResult) {
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
			} catch (err) {
				this.$logger.trace("Unable to get top NPM packages.");
				this.$logger.trace(err);
			}

			return plugins;
		}).future<IPlugin[]>()();
	}

	private getStringFromNpmSearchResult(pluginResult: any, propertyName: string): string {
		if (pluginResult && pluginResult[propertyName] && pluginResult[propertyName].length) {
			let item = _.first(pluginResult[propertyName]);
			if (item) {
				return item.toString();
			}
		}

		return "";
	}

	private getFeaturedNpmPackages(): IFuture<IPlugin[]> {
		return (() => {
			let plugins: IPlugin[] = [];
			try {
				if (this.featuredNpmPackages && this.featuredNpmPackages.length) {
					let pluginFutures = _.map(this.featuredNpmPackages, packageId => this.getDataForNpmPackage(packageId));
					plugins = getFuturesResults<IPlugin>(pluginFutures, pl => !!pl && !!pl.data);

					_.each(plugins, featuredPackage => {
						featuredPackage.type = PluginType.FeaturedPlugin;

						// Hide Variables and Url properties for the AppManager LiveSync Plugin.
						if (featuredPackage.data.Identifier === NativeScriptProjectPluginsService.NATIVESCRIPT_LIVEPATCH_PLUGIN_ID) {
							featuredPackage.data.Variables = [];
							featuredPackage.data.Url = "";
						}
					});
				}
			} catch (err) {
				this.$logger.trace("Unable to get advanced NPM packages.");
				this.$logger.trace(err);
				plugins = null;
			}

			return plugins;
		}).future<IPlugin[]>()();
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
					if (result) {
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
			} catch (err) {
				this.$logger.trace("Unable to get top NativeScript NPM packages.");
				this.$logger.trace(err);
				plugins = null;
			}

			return plugins;
		}).future<IPlugin[]>()();
	}

	private getDataForNpmPackage(packageName: string, version?: string): IFuture<IPlugin> {
		return ((): IPlugin => {
			version = version || "latest";
			let result = this.$npmService.getPackageJsonFromNpmRegistry(packageName, version).wait();
			if (result) {
				return this.constructNativeScriptPluginData(result).wait();
			}

			return null;
		}).future<IPlugin>()();
	}

	private getDataForLocalPlugin(packageName: string, pathToPlugin?: string): IFuture<IPlugin> {
		return ((): IPlugin => {
			if (!!pathToPlugin.match(/^file:/)) {
				pathToPlugin = pathToPlugin.replace("file:", "");
			}

			if (this.checkIsValidLocalPlugin(pathToPlugin).wait()) {
				let fullPath = path.resolve(pathToPlugin);
				let packageJsonContent = this.$fs.readJson(path.join(fullPath, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
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
			if (!!url.match(/^(http|git)/)) {
				let pathToInstalledPackage = this.installPackageToTempDir(url).wait();
				if (pathToInstalledPackage) {
					let packageJsonContent = this.$fs.readJson(path.join(pathToInstalledPackage, this.$projectConstants.PACKAGE_JSON_NAME)).wait();
					return this.constructNativeScriptPluginData(packageJsonContent).wait();

				}
			}

			return null;
		}).future<IPlugin>()();
	}

	private constructNativeScriptPluginData(packageJsonContent: any): IFuture<NativeScriptPluginData> {
		return ((): NativeScriptPluginData => {
			let platforms: string[];
			let supportedVersion: string;
			let type = PluginType.NpmPlugin;
			if (packageJsonContent.nativescript && packageJsonContent.nativescript.platforms) {
				type = PluginType.NpmNativeScriptPlugin;
				platforms = _.keys(packageJsonContent.nativescript.platforms);
				supportedVersion = semver.maxSatisfying(_.values<string>(packageJsonContent.nativescript.platforms), ">=0.0.0");
			}

			let data: IPluginInfoBase = {
				Authors: packageJsonContent.author ? [packageJsonContent.author.name || packageJsonContent.author] : null,
				Name: packageJsonContent.name,
				Identifier: packageJsonContent.name,
				Version: packageJsonContent.version,
				Url: (packageJsonContent.repository && packageJsonContent.repository.url) || packageJsonContent.homepage || '',
				Platforms: platforms,
				Description: packageJsonContent.description,
				SupportedVersion: supportedVersion,
				Variables: packageJsonContent.nativescript && packageJsonContent.nativescript.variables
			};

			return new NativeScriptPluginData(data, type, this.$project);
		}).future<NativeScriptPluginData>()();
	}

	private checkIsValidLocalPlugin(pluginName: string): IFuture<boolean> {
		return ((): boolean => {
			let fullPath = path.resolve(pluginName);

			return this.$fs.exists(fullPath) && this.$fs.exists(path.join(fullPath, this.$projectConstants.PACKAGE_JSON_NAME));
		}).future<boolean>()();
	}

	private getBasicPluginInfoFromMarketplace(pluginName: string, version: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let basicInfo: IBasicPluginInformation;
			let allMarketplacePlugins = this.getMarketplacePlugins().wait();
			let marketPlacePlugins: IPlugin[] = _.filter(allMarketplacePlugins, pl => pl.data.Identifier.toLowerCase() === pluginName.toLowerCase());
			if (marketPlacePlugins && marketPlacePlugins.length) {
				let selectedPlugin = this.selectMarketplacePlugin(marketPlacePlugins, version);

				if (selectedPlugin) {
					basicInfo = {
						name: selectedPlugin.data.Identifier,
						version: selectedPlugin.data.Version
					};

					// TODO: Use variables from server when it returns them to us.
					basicInfo.variables = this.getPluginVariablesInfoFromNpm(basicInfo.name, basicInfo.version).wait();
					if (!semver.satisfies(this.$project.projectData.FrameworkVersion, selectedPlugin.data.SupportedVersion)) {
						this.$errors.failWithoutHelp(`Plugin ${pluginName} requires at least version ${selectedPlugin.data.SupportedVersion}, but your project targets ${this.$project.projectData.FrameworkVersion}.`);
					}
				}
			}

			return basicInfo;
		}).future<IBasicPluginInformation>()();
	}

	private selectMarketplacePlugin(marketPlacePlugins: IPlugin[], version: string): IPlugin {
		let plugin: IPlugin;

		if (this.$options.default && marketPlacePlugins.length) {
			version = this.getDefaultPluginVersion(marketPlacePlugins[0]);
		}

		if (!version || version === "latest") {
			version = _(marketPlacePlugins)
				.map((marketplacePlugin: IPlugin) => marketplacePlugin.data.Version)
				.sort((firstVersion: string, secondVersion: string) => semver.gt(firstVersion, secondVersion) ? -1 : 1)
				.first();
		}

		if (version && semver.valid(version)) {
			plugin = _.find(marketPlacePlugins, (marketPlacePlugin: IPlugin) => marketPlacePlugin.data.Version === version);
		}

		return plugin;
	}

	private getBasicPluginInfoFromNpm(name: string, version: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let basicInfo: IBasicPluginInformation;
			let jsonInfo = this.$npmService.getPackageJsonFromNpmRegistry(name, version).wait();
			if (jsonInfo) {
				basicInfo = {
					name: jsonInfo.name,
					version: jsonInfo.version,
					variables: jsonInfo.nativescript && jsonInfo.nativescript.variables
				};

				if (jsonInfo.nativescript && jsonInfo.nativescript.platforms) {
					const requiredVersions = _.values<string>(jsonInfo.nativescript.platforms)
						.filter(ver => !!semver.valid(ver));

					const notSupportedValues = requiredVersions.filter(ver => semver.gt(ver, this.$project.projectData.FrameworkVersion));

					if (requiredVersions.length && notSupportedValues.length === requiredVersions.length) {
						this.$errors.failWithoutHelp(`Plugin ${name} requires newer version of NativeScript, your project targets ${this.$project.projectData.FrameworkVersion}.`);
					}
				}
			}

			return basicInfo;
		}).future<IBasicPluginInformation>()();
	}

	private getPluginVariablesInfoFromNpm(name: string, version: string): IFuture<any> {
		return ((): any => {
			let jsonInfo = this.$npmService.getPackageJsonFromNpmRegistry(name, version).wait();
			return jsonInfo && jsonInfo.nativescript && jsonInfo.nativescript.variables;
		}).future<any>()();
	}

	private getBasicPluginInfoFromUrl(url: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let basicInfo: IBasicPluginInformation;

			/* From `npm help install`:
			 * <protocol> is one of git, git+ssh, git+http, or git+https. If no <commit-ish> is specified, then master is used.
			 */
			if (!!url.match(/^(http|git)/)) {
				let pathToInstalledPackage = this.installPackageToTempDir(url).wait();
				if (pathToInstalledPackage) {
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

	private setPluginInPackageJson(pluginIdentifier: string, pluginOpts?: { addPluginToPackageJson: boolean }): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let pathToPackageJson = this.getPathToProjectPackageJson(),
				packageJsonContent = this.getProjectPackageJsonContent().wait(),
				pluginBasicInfo = this.getPluginBasicInformation(pluginIdentifier).wait(),
				name = pluginBasicInfo.name,
				selectedVersion = pluginBasicInfo.version || "latest",
				basicPlugin = this.getBasicPluginInfoFromMarketplace(name, selectedVersion).wait() ||
					this.getBasicPluginInfoFromNpm(name, selectedVersion).wait() ||
					this.getBasicPluginInfoFromUrl(pluginIdentifier).wait();

			if (!basicPlugin) {
				this.$errors.failWithoutHelp(`Unable to add plugin ${pluginIdentifier}. Make sure you've provided a valid name, path to local directory or git URL.`);
			}

			if (pluginOpts && pluginOpts.addPluginToPackageJson) {
				packageJsonContent.dependencies[basicPlugin.name] = basicPlugin.version;
			}

			// Skip variables configuration for AppManager LiveSync Plugin.
			if (basicPlugin.variables && pluginIdentifier !== NativeScriptProjectPluginsService.NATIVESCRIPT_LIVEPATCH_PLUGIN_ID) {
				packageJsonContent = this.setPluginVariables(packageJsonContent, basicPlugin).wait();
			}

			this.$fs.writeJson(pathToPackageJson, packageJsonContent).wait();
			return basicPlugin;
		}).future<IBasicPluginInformation>()();
	}

	private setPluginVariables(packageJsonContent: any, basicPlugin: IBasicPluginInformation): IFuture<any> {
		return ((): any => {
			let variablesInformation = basicPlugin.variables;
			if (variablesInformation && _.keys(variablesInformation).length) {
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
				if (_.keys(newObj).length) {
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

			if (defaultValue) {
				schema.default = () => defaultValue;
			}

			let fromVarOpion = this.$pluginVariablesHelper.getPluginVariableFromVarOption(variableName);
			if (!isInteractive() && !fromVarOpion) {
				if (defaultValue) {
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
}

$injector.register("nativeScriptProjectPluginsService", NativeScriptProjectPluginsService);

export enum PluginType {
	NpmPlugin = 0,
	NpmNativeScriptPlugin = 1,
	MarketplacePlugin = 2,
	FeaturedPlugin = 3
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
		if (this.data.Platforms && this.data.Platforms.length > 0) {
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

		if (this.data.Authors) {
			result.push(this.buildRow("Authors", this.data.Authors.join(", ")));
		}

		if (this.data.SupportedVersion) {
			let supportedVersion = this.buildRow("Supported Version", this.data.SupportedVersion);
			result.push(supportedVersion);
		}

		if (this.configurations && this.configurations.length > 0) {
			result.push(util.format("    Configuration: %s", this.configurations.join(", ")));
		}

		if (this.data.Variables && _.keys(this.data.Variables).length) {
			let varInfo = this.$project.getPluginVariablesInfo().wait();
			if (varInfo && varInfo[this.data.Identifier]) {
				result.push("    Variables:");
				_.each(varInfo[this.data.Identifier], (variableValue: any, variableName: string) => {
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

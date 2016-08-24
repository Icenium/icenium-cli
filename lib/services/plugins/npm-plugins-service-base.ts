///<reference path="../../.d.ts"/>

import * as path from "path";
import * as util from "util";
import * as shelljs from "shelljs";
import * as semver from "semver";
import * as validUrl from "valid-url";
import * as commonHelpers from "../../common/helpers";
import temp = require("temp");
temp.track();

export abstract class NpmPluginsServiceBase implements IPluginsService {
	protected static NODE_MODULES_DIR_NAME = "node_modules";

	private static NPM_REGISTRY_ADDRESS = "http://registry.npmjs.org";

	constructor(protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		protected $fs: IFileSystem,
		protected $project: Project.IProject,
		protected $projectConstants: Project.IConstants,
		protected $childProcess: IChildProcess,
		protected $httpClient: Server.IHttpClient,
		protected $options: IOptions,
		private $hostInfo: IHostInfo,
		private $progressIndicator: IProgressIndicator) { }

	public findPlugins(keywords: string[]): IFuture<IBasicPluginInformation[]> {
		return ((): IBasicPluginInformation[] => {
			let pluginsFound: IBasicPluginInformation[] = [];

			let query = this.composeSearchQuery(keywords);

			let searchParams = ["search"].concat(query);

			let npmCommand = this.$hostInfo.isWindows ? "npm.cmd" : "npm";

			let npmFuture = this.$childProcess.spawnFromEvent(npmCommand, searchParams, "close");

			this.$logger.printInfoMessageOnSameLine("Searching for plugins in npm, please wait.");

			this.$progressIndicator.showProgressIndicator(npmFuture, 2000).wait();

			let npmSearchResult = npmFuture.get();

			if (npmSearchResult.stderr) {
				// npm will write "npm WARN Building the local index for the first time, please be patient" to the stderr and if it is the only message on the stderr we should ignore it.
				let splitError = npmSearchResult.stderr.split("\n");
				if (splitError.length > 2 || splitError[0].indexOf("Building the local index for the first time") === -1) {
					this.$errors.failWithoutHelp(npmSearchResult.stderr);
				}
			}

			// Need to split the result only by \n because the npm result contains only \n and on Windows it will not split correctly when using EOL.
			// Sample output:
			// NAME                    DESCRIPTION             AUTHOR        DATE       VERSION  KEYWORDS
			// cordova-plugin-console  Cordova Console Plugin  =csantanapr…  2016-04-20 1.0.3    cordova console ecosystem:cordova cordova-ios
			let pluginsRows: string[] = npmSearchResult.stdout.split("\n");

			// Remove the table headers row.
			pluginsRows.shift();

			let npmNameGroup = "(\\S+)";
			let npmDateGroup = "(\\d+\\-\\d+\\-\\d+)\\s";
			let npmFreeTextGroup = "([^=]+)";
			let npmAuthorsGroup = "((?:=\\S+\\s?)+)\\s+";

			// Should look like this /(\S+)\s+([^=]+)((?:=\S+\s?)+)\s+(\d+\-\d+\-\d+)\s(\S+)(\s+([^=]+))?/
			let pluginRowRegExp = new RegExp(`${npmNameGroup}\\s+${npmFreeTextGroup}${npmAuthorsGroup}${npmDateGroup}${npmNameGroup}(\\s+${npmFreeTextGroup})?`);

			_.each(pluginsRows, (pluginRow: string) => {
				let matches = pluginRowRegExp.exec(pluginRow.trim());

				if (!matches || !matches[0]) {
					return;
				}

				pluginsFound.push({
					name: matches[1],
					description: matches[2],
					version: matches[5]
				});
			});

			return pluginsFound;
		}).future<IBasicPluginInformation[]>()();
	}

	public fetch(pluginIdentifier: string): IFuture<void> {
		return (() => {
			this.$project.ensureProject();
			if (!pluginIdentifier) {
				this.$errors.fail("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the NPM.");
			}

			if (this.isUrlToRepository(pluginIdentifier) || this.isLocalPath(pluginIdentifier).wait()) {
				let options: NpmPlugins.IFetchLocalPluginOptions = {
					useOriginalPluginDirectory: true
				};

				if (this.hasTgzExtension(pluginIdentifier)) {
					pluginIdentifier = path.resolve(pluginIdentifier);
					options.useOriginalPluginDirectory = false;
				}

				this.fetchPluginCore(pluginIdentifier, options).wait();
				return;
			}

			let plugin = _.find(this.getAvailablePlugins(), (pl: IPlugin) => pl.data.Identifier.toLowerCase() === pluginIdentifier || pl.data.Name.toLowerCase() === pluginIdentifier);
			let pluginUrl = plugin && plugin.data && plugin.data.Url ? plugin.data.Url : null;

			let npmRegistryResult = this.searchNpmRegistry(pluginIdentifier).wait();
			let plugins = npmRegistryResult ? [npmRegistryResult] : this.findPlugins([pluginIdentifier]).wait();

			let pluginKeys = _.map(plugins, (pluginInfo: IBasicPluginInformation) => pluginInfo.name);
			let pluginsCount = pluginKeys.length;

			if (pluginsCount === 0) {
				if (pluginUrl) {
					try {
						// The plugin is not in npm but it is in our marketplace.
						this.fetchPluginCore(pluginUrl).wait();
					} catch (error) {
						this.$logger.info("The plugin cannot be downloaded using npm, because it has no package.json in it. You can still download it from this link: " + plugin.data.Url.grey);
					}
				} else {
					this.fetchPluginCore(pluginIdentifier).wait();
				}

				return;
			}

			if (pluginsCount > 1 && pluginKeys[0] !== pluginIdentifier) {
				if (commonHelpers.isInteractive()) {
					let selectedPlugin = this.$prompter.promptForChoice("We found multiple plugins with your search parameters please choose which one you want to fetch.", pluginKeys).wait();
					this.fetchPluginCore(selectedPlugin).wait();
				} else {
					this.$errors.failWithoutHelp("There are more then 1 matching plugins: " + pluginKeys.join(", ") + ".");
				}

				return;
			}

			try {
				this.fetchPluginCore(pluginKeys[0]).wait();
			} catch (err) {
				if (pluginUrl) {
					this.$logger.trace("Error while trying to fetch plugin with id " + pluginIdentifier + " via npm. Error is: " + err.message + ".");
					this.fetchPluginCore(pluginUrl).wait();
				} else {
					this.$errors.failWithoutHelp(err.message);
				}
			}
		}).future<void>()();
	}

	public abstract getAvailablePlugins(pluginsCount?: number): IPlugin[];

	public abstract getInstalledPlugins(): IPlugin[];

	public abstract printPlugins(plugins: IPlugin[]): void;

	public abstract addPlugin(pluginIdentifier: string): IFuture<void>;

	public abstract removePlugin(pluginName: string): IFuture<void>;

	public abstract configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void>;

	public abstract isPluginInstalled(pluginName: string): boolean;

	public abstract getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation>;

	public abstract filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]>;

	protected isPluginFetched(pluginName: string): IFuture<boolean> {
		return ((): boolean => {
			// Fetched plugins are in the "plugins" directory both for Cordova and NativeScript projects.
			let projectPluginsDirectory = path.join(this.$project.projectDir, "plugins");
			let filterOptions = { enumerateDirectories: true, includeEmptyDirectories: false };

			if (!this.$fs.exists(projectPluginsDirectory).wait()) {
				return false;
			}

			let fetchedPlugins = this.$fs.enumerateFilesInDirectorySync(projectPluginsDirectory, (item: string) => {
				let itemBaseName = path.basename(item);

				if (this.hasTgzExtension(item)) {
					itemBaseName = itemBaseName.replace(path.extname(itemBaseName), "");

					if (semver.valid(itemBaseName.substr(itemBaseName.lastIndexOf("-") + 1))) {
						// The plugin tgz has the version in its name.
						itemBaseName = itemBaseName.substring(0, itemBaseName.lastIndexOf("-"));
					}
				}

				return itemBaseName === pluginName;
			}, filterOptions);

			return !!(fetchedPlugins && fetchedPlugins.length);
		}).future<boolean>()();
	}

	protected hasTgzExtension(pluginidentifier: string): boolean {
		let pluginIdentifierExtname = path.extname(pluginidentifier);
		return this.isLocalPath(pluginidentifier).wait() && (pluginIdentifierExtname === ".tgz" || pluginIdentifierExtname === ".gz");
	}

	protected fetchPluginBasicInformation(pluginIdentifier: string, failMessageMethodName: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let pathToInstalledPlugin = this.installPackageToTempDir(pluginIdentifier).wait();
			let installLocalPluginOptions: ILocalPluginData = {
				actualName: pluginData && pluginData.actualName,
				isTgz: pluginData && pluginData.isTgz,
				addPluginToConfigFile: false,
				suppressMessage: pluginData && pluginData.suppressMessage,
				configFileContents: pluginData.configFileContents
			};

			if (pathToInstalledPlugin) {
				return this.fetchPluginBasicInformationCore(pathToInstalledPlugin, installLocalPluginOptions, options).wait();
			} else {
				let errorMessage = ("Unable to " + failMessageMethodName + " plugin " + pluginIdentifier + ".") +
					" Make sure this is a valid plugin name, path to existing directory or git URL.";
				this.$errors.failWithoutHelp(errorMessage);
			}
		}).future<IBasicPluginInformation>()();
	}

	protected installPackageToTempDir(identifier: string): IFuture<string> {
		return ((): string => {
			let tempInstallDir = temp.mkdirSync("pluginInstallation");
			try {
				// Create package.json in the temp directory in order to be sure that the package will be installed inside <temp_dir>/node_modules
				let packageJsonData = {
					name: "tempPackage",
					version: "1.0.0"
				};
				this.$fs.writeJson(path.join(tempInstallDir, this.$projectConstants.PACKAGE_JSON_NAME), packageJsonData).wait();

				let npmInstallOutput: string = this.$childProcess.exec(`npm install ${identifier} --production --ignore-scripts`, { cwd: tempInstallDir }).wait();
				let pathToPackage = path.join(tempInstallDir, NpmPluginsServiceBase.NODE_MODULES_DIR_NAME);

				if (this.$fs.exists(pathToPackage).wait()) {
					// Most probably the package is installed inside node_modules dir in temp folder.
					let dirs = this.$fs.readDirectory(pathToPackage).wait().filter(dirName => dirName !== ".bin");
					// In case npm3 is installed on user's machine and the package has dependencies, there will be more than one dir, so we cannot be sure which one is ours.
					if (dirs.length === 1) {
						return path.join(pathToPackage, _.first(dirs));
					}
				}

				// output is something like: tempPackage@1.0.0 C:\Users\VLADIM~1\AppData\Local\Temp\1\nativeScriptPluginInstallation116013-39060-jpwbm9
				//                           └── plugin-var-plugin@1.0.0  extraneous
				let npm2OutputMatch = npmInstallOutput.match(/.*?tempPackage@1\.0\.0.*?\r?\n.*?\s+?(.*?)@.*?\s+?/m);
				if (npm2OutputMatch) {
					return path.join(tempInstallDir, NpmPluginsServiceBase.NODE_MODULES_DIR_NAME, npm2OutputMatch[1]);
				}

				// output is something like: nativescript-google-sdk@0.1.18 node_modules\nativescript-google-sdk\n
				// If the plugin has dependencies the plugin name will be the last row of the output.
				let npmOutputMatchRegExp = /.*?@.*?\s+?(.*?node_modules.*?)\r?\n?$/;
				let pluginDirectory = _(npmInstallOutput)
					.split("\n")
					.map((row: string) => {
						row = row && row.trim();
						let matches = npmOutputMatchRegExp.exec(row);
						return matches && matches.length ? matches[1] : undefined;
					})
					.filter((row: string) => !!row)
					.last();

				if (pluginDirectory) {
					return path.join(tempInstallDir, pluginDirectory);
				}
			} catch (err) {
				// Uncomment when all of our marketplace plugins have package.json
				// this.$logger.trace(err);
				throw err;
			}

			return null;
		}).future<string>()();
	}

	protected installLocalPlugin(pluginPath: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let pathToPlugin = path.resolve(pluginPath);

			// In case the user tries to add plugin from local directory we should check if the original directory is part of the project instead of the directory in Temp.
			let directoryToCheck = (options && options.useOriginalPluginDirectory) ? options.originalPluginDirectory : pathToPlugin;

			// In case the plugin is not part of the project or it is under node_modules, copy it to plugins
			if (this.shouldCopyToPluginsDirectory(directoryToCheck).wait()) {
				let pathToInstall = path.join(this.$project.getProjectDir().wait(), "plugins");
				if (!pluginData || !pluginData.suppressMessage) {
					let actualPlugin = pluginData ? path.resolve(pluginData.actualName) : pluginPath;
					this.$logger.printMarkdown(util.format("Copying `%s` to `%s` in order to be able to use the plugin in your project.", actualPlugin, pathToInstall));
				}

				// use cp instead of mv, as it would fail if pathToInstalledPlugin is mounted
				// on a different device from the pluginsPath with error:
				// Error: EXDEV, cross-device link not permitted
				shelljs.cp("-Rf", pathToPlugin, pathToInstall);
				pathToPlugin = path.join(pathToInstall, path.basename(pathToPlugin));
			}

			return this.installLocalPluginCore(pathToPlugin, pluginData).wait();
		}).future<IBasicPluginInformation>()();
	}

	protected isPluginPartOfTheProject(pathToPlugin: string): IFuture<boolean> {
		return ((): boolean => {
			return pathToPlugin.indexOf(this.$project.getProjectDir().wait()) !== -1;
		}).future<boolean>()();
	}

	protected shouldCopyToPluginsDirectory(pluginPath: string): IFuture<boolean> {
		return ((): boolean => {
			return !this.isPluginPartOfTheProject(pluginPath).wait();
		}).future<boolean>()();
	}

	protected getDefaultPluginVersion(plugin: IPlugin): string {
		return (<IMarketplacePlugin>plugin).pluginVersionsData.DefaultVersion;
	}

	protected abstract fetchPluginBasicInformationCore(pathToInstalledPlugin: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation>;

	protected abstract installLocalPluginCore(pluginPath: string, pluginOpts?: ILocalPluginData): IFuture<IBasicPluginInformation>;

	protected abstract getPluginsDirName(): string;

	protected abstract composeSearchQuery(keywords: string[]): string[];

	private fetchPluginCore(pluginIdentifier: string, options: NpmPlugins.IFetchLocalPluginOptions = { useOriginalPluginDirectory: false }): IFuture<void> {
		return (() => {
			let pluginBasicInfo: IBasicPluginInformation;
			let pluginLocalPath = path.resolve(pluginIdentifier);
			let pluginLocalPathExists = this.$fs.exists(pluginLocalPath).wait();
			let suppressMessage = pluginLocalPathExists && (pluginLocalPath.indexOf(this.$project.getProjectDir().wait()) === -1 || pluginLocalPath.indexOf(this.getPluginsDirName()) !== -1);

			let pluginData: ILocalPluginData = {
				actualName: pluginIdentifier,
				isTgz: this.hasTgzExtension(pluginIdentifier),
				addPluginToConfigFile: false,
				suppressMessage: !suppressMessage
			};

			let pluginId = pluginIdentifier;

			if (pluginLocalPathExists) {
				pluginId = pluginLocalPath;
				options.originalPluginDirectory = pluginLocalPath;
			} else {
				options.useOriginalPluginDirectory = false;
			}

			pluginBasicInfo = this.fetchPluginBasicInformation(pluginId, "fetch", pluginData, options).wait();

			this.$logger.printMarkdown(util.format("Successfully fetched plugin `%s`.", pluginBasicInfo.name));
		}).future<void>()();
	}

	private isLocalPath(pluginId: string): IFuture<boolean> {
		return this.$fs.exists(pluginId);
	}

	private isUrlToRepository(pluginId: string): boolean {
		return validUrl.isUri(pluginId);
	}

	private searchNpmRegistry(pluginIdentifier: string): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let npmRegistryRequestFuture = this.$httpClient.httpRequest(`${NpmPluginsServiceBase.NPM_REGISTRY_ADDRESS}/${pluginIdentifier}`);

			this.$logger.printInfoMessageOnSameLine(`Searching for '${pluginIdentifier}' in ${NpmPluginsServiceBase.NPM_REGISTRY_ADDRESS}, please wait.`);
			try {
				this.$progressIndicator.showProgressIndicator(npmRegistryRequestFuture, 2000).wait();
			} catch (err) {
				if (err.response.statusCode === 404) {
					return null;
				} else {
					throw err;
				}
			}

			let response = npmRegistryRequestFuture.get();
			let responseBody = response && response.body;

			if (!responseBody) {
				return null;
			}

			let pluginInfo: NpmPlugins.INpmRegistryResult = JSON.parse(responseBody);

			let latestVersion = _(pluginInfo.versions)
				.keys()
				.sort()
				.last();

			return pluginInfo.versions[latestVersion];
		}).future<IBasicPluginInformation>()();
	}
}

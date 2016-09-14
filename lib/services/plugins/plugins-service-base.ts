import * as path from "path";
import * as util from "util";
import * as shelljs from "shelljs";
import * as semver from "semver";
import * as validUrl from "valid-url";
import * as commonHelpers from "../../common/helpers";
import {NODE_MODULES_DIR_NAME} from "../../common/constants";
import temp = require("temp");
temp.track();

export abstract class PluginsServiceBase implements IPluginsService {
	constructor(protected $errors: IErrors,
		protected $logger: ILogger,
		protected $prompter: IPrompter,
		protected $fs: IFileSystem,
		protected $project: Project.IProject,
		protected $projectConstants: Project.IConstants,
		protected $childProcess: IChildProcess,
		protected $httpClient: Server.IHttpClient,
		protected $options: IOptions,
		protected $npmService: INpmService,
		private $hostInfo: IHostInfo,
		private $npmPluginsService: INpmPluginsService) { }

	public findPlugins(keywords: string[]): IFuture<IPluginsSource> {
		return this.$npmPluginsService.search(this.$project.projectDir, keywords, this.composeSearchQuery);
	}

	public fetch(pluginIdentifier: string): IFuture<string> {
		return ((): string => {
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

				return this.fetchPluginCore(pluginIdentifier, null, options).wait();
			}

			let plugin = _.find(this.getAvailablePlugins(), (pl: IPlugin) => pl.data.Identifier.toLowerCase() === pluginIdentifier || pl.data.Name.toLowerCase() === pluginIdentifier);
			let pluginUrl = plugin && plugin.data && plugin.data.Url ? plugin.data.Url : null;

			let plugins = this.$npmPluginsService.optimizedSearch(this.$project.projectDir, [pluginIdentifier]).wait().getAllPlugins().wait();

			let pluginKeys = _.map(plugins, (pluginInfo: IBasicPluginInformation) => pluginInfo.name);
			let pluginsCount = pluginKeys.length;

			if (pluginsCount === 0) {
				if (pluginUrl) {
					try {
						// The plugin is not in npm but it is in our marketplace.
						return this.fetchPluginCore(pluginUrl).wait();
					} catch (error) {
						this.$errors.failWithoutHelp(`The plugin cannot be downloaded using npm, because it has no package.json in it. You can still download it from this link: ${plugin.data.Url.grey}`);
					}
				} else {
					if (this.$fs.exists(path.resolve(pluginIdentifier)).wait()) {
						return this.fetchPluginCore(pluginIdentifier).wait();
					} else {
						this.$errors.failWithoutHelp(`The plugin ${pluginIdentifier} was not found in npm and it is not path to existing local plugin.`);
					}
				}
			}

			let npmPluginResult = plugins[0];
			if (pluginsCount > 1 && npmPluginResult.name !== pluginIdentifier) {
				if (commonHelpers.isInteractive()) {
					let selectedPlugin = this.$prompter.promptForChoice("We found multiple plugins with your search parameters please choose which one you want to fetch.", pluginKeys).wait();
					return this.fetchPluginCore(selectedPlugin).wait();
				} else {
					this.$errors.failWithoutHelp("There are more then 1 matching plugins: " + pluginKeys.join(", ") + ".");
				}
			}

			try {
				return this.fetchPluginCore(npmPluginResult.name, npmPluginResult.version).wait();
			} catch (err) {
				if (pluginUrl) {
					this.$logger.trace("Error while trying to fetch plugin with id " + pluginIdentifier + " via npm. Error is: " + err.message + ".");
					return this.fetchPluginCore(pluginUrl).wait();
				} else {
					this.$errors.failWithoutHelp(err.message);
				}
			}
		}).future<string>()();
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

	protected fetchPluginBasicInformation(pluginIdentifier: string, version: string, failMessageMethodName: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation> {
		return ((): IBasicPluginInformation => {
			let pathToInstalledPlugin = this.installPackageToTempDir(pluginIdentifier, version).wait();

			this.validatePluginInformation(pathToInstalledPlugin).wait();

			let installLocalPluginOptions: ILocalPluginData = {
				actualName: pluginData && pluginData.actualName,
				isTgz: pluginData && pluginData.isTgz,
				addPluginToConfigFile: false,
				suppressMessage: pluginData && pluginData.suppressMessage,
				configFileContents: pluginData.configFileContents
			};

			if (pathToInstalledPlugin) {
				return this.fetchPluginBasicInformationCore(pathToInstalledPlugin, version, installLocalPluginOptions, options).wait();
			} else {
				let errorMessage = ("Unable to " + failMessageMethodName + " plugin " + pluginIdentifier + ".") +
					" Make sure this is a valid plugin name, path to existing directory or git URL.";
				this.$errors.failWithoutHelp(errorMessage);
			}
		}).future<IBasicPluginInformation>()();
	}

	protected installPackageToTempDir(identifier: string, version?: string): IFuture<string> {
		return ((): string => {
			let tempInstallDir = temp.mkdirSync("pluginInstallation");
			try {
				// Create package.json in the temp directory in order to be sure that the package will be installed inside <temp_dir>/node_modules
				let packageJsonData = {
					name: "tempPackage",
					version: "1.0.0"
				};
				this.$fs.writeJson(path.join(tempInstallDir, this.$projectConstants.PACKAGE_JSON_NAME), packageJsonData).wait();
				if (version) {
					identifier = `${identifier}@${version}`;
				}

				let npmInstallOutput: string = this.$childProcess.exec(`npm install ${identifier} --production --ignore-scripts`, { cwd: tempInstallDir }).wait();
				let pathToPackage = path.join(tempInstallDir, NODE_MODULES_DIR_NAME);

				if (this.$fs.exists(pathToPackage).wait()) {
					// Most probably the package is installed inside node_modules dir in temp folder.
					let dirs = this.$fs.readDirectory(pathToPackage).wait().filter(dirName => dirName !== ".bin");
					// In case npm3 is installed on user's machine and the package has dependencies, there will be more than one dir, so we cannot be sure which one is ours.
					if (dirs.length === 1) {
						let pathToPlugin = path.join(pathToPackage, _.first(dirs));
						this.removeFetchedPluginDependencies(pathToPlugin).wait();
						return pathToPlugin;
					}
				}

				// output is something like: tempPackage@1.0.0 C:\Users\VLADIM~1\AppData\Local\Temp\1\nativeScriptPluginInstallation116013-39060-jpwbm9
				//                           └── plugin-var-plugin@1.0.0  extraneous
				let npm2OutputMatch = npmInstallOutput.match(/.*?tempPackage@1\.0\.0.*?\r?\n.*?\s+?(.*?)@.*?\s+?/m);
				if (npm2OutputMatch) {
					let pathToPlugin = path.join(tempInstallDir, NODE_MODULES_DIR_NAME, npm2OutputMatch[1]);
					this.removeFetchedPluginDependencies(pathToPlugin).wait();
					return pathToPlugin;
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
					let pathToPlugin = path.join(tempInstallDir, pluginDirectory);
					this.removeFetchedPluginDependencies(pathToPlugin).wait();
					return pathToPlugin;
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
			// In case the user tries to add plugin from local directory we should check if the original directory is part of the project instead of the directory in Temp.
			let pathToPlugin = (options && options.useOriginalPluginDirectory) ? options.originalPluginDirectory : path.resolve(pluginPath);

			// In case the plugin is not part of the project or it is under node_modules, copy it to plugins
			if (this.shouldCopyToPluginsDirectory(pathToPlugin).wait()) {
				let copyLocalPluginData = this.getCopyLocalPluginData(pathToPlugin);

				let pathToInstall = copyLocalPluginData.destinationDirectory;

				if (!pluginData || !pluginData.suppressMessage) {
					let actualPlugin = pluginData ? path.resolve(pluginData.actualName) : pluginPath;
					this.$logger.printMarkdown(util.format("Copying `%s` to `%s` in order to be able to use the plugin in your project.", actualPlugin, pathToInstall));
				}

				// use cp instead of mv, as it would fail if pathToInstalledPlugin is mounted
				// on a different device from the pluginsPath with error:
				// Error: EXDEV, cross-device link not permitted
				this.$fs.ensureDirectoryExists(pathToInstall).wait();
				shelljs.cp("-Rf", copyLocalPluginData.sourceDirectory, pathToInstall);
				pathToPlugin = pathToInstall;
			}

			return this.installLocalPluginCore(pathToPlugin, pluginData).wait();
		}).future<IBasicPluginInformation>()();
	}

	protected getCopyLocalPluginData(pathToPlugin: string): NpmPlugins.ICopyLocalPluginData {
		let lastIndexOfNodeModules = pathToPlugin.lastIndexOf(NODE_MODULES_DIR_NAME);
		// We need to get the exact plugin directory relative to the node_modules directory because if we try to fetch scoped dependency for example @angular/core the plugin will not be in node_modeules/core but in node_modules/@angular/core.
		let targetPluginDirectory = lastIndexOfNodeModules !== -1 ? pathToPlugin.substring(lastIndexOfNodeModules + NODE_MODULES_DIR_NAME.length) : path.basename(pathToPlugin);
		return {
			sourceDirectory: path.join(pathToPlugin, path.sep, "*"),
			destinationDirectory: path.join(this.$project.getProjectDir().wait(), "plugins", targetPluginDirectory)
		};
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

	protected abstract fetchPluginBasicInformationCore(pathToInstalledPlugin: string, version: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation>;

	protected abstract installLocalPluginCore(pluginPath: string, pluginOpts?: ILocalPluginData): IFuture<IBasicPluginInformation>;

	protected abstract getPluginsDirName(): string;

	protected abstract composeSearchQuery(keywords: string[]): string[];

	protected abstract validatePluginInformation(pathToPlugin: string): IFuture<void>;

	private fetchPluginCore(pluginIdentifier: string, version?: string, options: NpmPlugins.IFetchLocalPluginOptions = { useOriginalPluginDirectory: false }): IFuture<string> {
		return ((): string => {
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

			pluginBasicInfo = this.fetchPluginBasicInformation(pluginId, version, "fetch", pluginData, options).wait();

			return pluginBasicInfo.name;
		}).future<string>()();
	}

	private isLocalPath(pluginId: string): IFuture<boolean> {
		return this.$fs.exists(pluginId);
	}

	private isUrlToRepository(pluginId: string): boolean {
		return validUrl.isUri(pluginId);
	}

	private removeFetchedPluginDependencies(pathToPlugin: string): IFuture<void> {
		let dependenciesDirectory = path.join(pathToPlugin, NODE_MODULES_DIR_NAME);

		return this.$fs.deleteDirectory(dependenciesDirectory);
	}
}

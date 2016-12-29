import * as path from "path";
import * as util from "util";
import * as shelljs from "shelljs";
import * as semver from "semver";
import * as validUrl from "valid-url";
import * as commonHelpers from "../../common/helpers";
import {NODE_MODULES_DIR_NAME} from "../../common/constants";
import * as temp from "temp";

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

	public async findPlugins(keywords: string[]): Promise<IPluginsSource> {
		return this.$npmPluginsService.search(this.$project.projectDir, keywords, this.composeSearchQuery);
	}

	public async fetch(pluginIdentifier: string): Promise<string> {
			this.$project.ensureProject();
			if (!pluginIdentifier) {
				this.$errors.fail("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the NPM.");
			}

			if (this.isUrlToRepository(pluginIdentifier) || this.isLocalPath(pluginIdentifier)) {
				let options: NpmPlugins.IFetchLocalPluginOptions = {
					useOriginalPluginDirectory: true
				};

				if (this.hasTgzExtension(pluginIdentifier)) {
					pluginIdentifier = path.resolve(pluginIdentifier);
					options.useOriginalPluginDirectory = false;
				}

				await return this.fetchPluginCore(pluginIdentifier, null, options);
			}

			let plugin = _.find(this.getAvailablePlugins(), (pl: IPlugin) => pl.data.Identifier.toLowerCase() === pluginIdentifier || pl.data.Name.toLowerCase() === pluginIdentifier);
			let pluginUrl = plugin && plugin.data && plugin.data.Url ? plugin.data.Url : null;

			let plugins = await  (await  this.$npmPluginsService.optimizedSearch(this.$project.projectDir, [pluginIdentifier])).getAllPlugins();

			let pluginKeys = _.map(plugins, (pluginInfo: IBasicPluginInformation) => pluginInfo.name);
			let pluginsCount = pluginKeys.length;

			if (pluginsCount === 0) {
				if (pluginUrl) {
					try {
						// The plugin is not in npm but it is in our marketplace.
						await return this.fetchPluginCore(pluginUrl);
					} catch (error) {
						this.$errors.failWithoutHelp(`The plugin cannot be downloaded using npm, because it has no package.json in it. You can still download it from this link: ${plugin.data.Url.grey}`);
					}
				} else {
					if (this.$fs.exists(path.resolve(pluginIdentifier))) {
						await return this.fetchPluginCore(pluginIdentifier);
					} else {
						this.$errors.failWithoutHelp(`The plugin ${pluginIdentifier} was not found in npm and it is not path to existing local plugin.`);
					}
				}
			}

			let npmPluginResult = plugins[0];
			if (pluginsCount > 1 && npmPluginResult.name !== pluginIdentifier) {
				if (commonHelpers.isInteractive()) {
					let selectedPlugin = await  this.$prompter.promptForChoice("We found multiple plugins with your search parameters please choose which one you want to fetch.", pluginKeys);
					await return this.fetchPluginCore(selectedPlugin);
				} else {
					this.$errors.failWithoutHelp("There are more then 1 matching plugins: " + pluginKeys.join(", ") + ".");
				}
			}

			try {
				await return this.fetchPluginCore(npmPluginResult.name, npmPluginResult.version);
			} catch (err) {
				if (pluginUrl) {
					this.$logger.trace("Error while trying to fetch plugin with id " + pluginIdentifier + " via npm. Error is: " + err.message + ".");
					await return this.fetchPluginCore(pluginUrl);
				} else {
					this.$errors.failWithoutHelp(err.message);
				}
			}
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

	protected async isPluginFetched(pluginName: string): Promise<boolean> {
			// Fetched plugins are in the "plugins" directory both for Cordova and NativeScript projects.
			let projectPluginsDirectory = path.join(this.$project.projectDir, "plugins");
			let filterOptions = { enumerateDirectories: true, includeEmptyDirectories: false };

			if (!this.$fs.exists(projectPluginsDirectory)) {
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
	}

	protected hasTgzExtension(pluginidentifier: string): boolean {
		let pluginIdentifierExtname = path.extname(pluginidentifier);
		return this.isLocalPath(pluginidentifier) && (pluginIdentifierExtname === ".tgz" || pluginIdentifierExtname === ".gz");
	}

	protected async fetchPluginBasicInformation(pluginIdentifier: string, version: string, failMessageMethodName: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): Promise<IBasicPluginInformation> {
			let pathToInstalledPlugin = await  this.installPackageToTempDir(pluginIdentifier, version);

			this.validatePluginInformation(pathToInstalledPlugin);

			let installLocalPluginOptions: ILocalPluginData = {
				actualName: pluginData && pluginData.actualName,
				isTgz: pluginData && pluginData.isTgz,
				addPluginToConfigFile: false,
				suppressMessage: pluginData && pluginData.suppressMessage,
				configFileContents: pluginData.configFileContents
			};

			if (pathToInstalledPlugin) {
				await return this.fetchPluginBasicInformationCore(pathToInstalledPlugin, version, installLocalPluginOptions, options);
			} else {
				let errorMessage = ("Unable to " + failMessageMethodName + " plugin " + pluginIdentifier + ".") +
					" Make sure this is a valid plugin name, path to existing directory or git URL.";
				this.$errors.failWithoutHelp(errorMessage);
			}
	}

	protected async installPackageToTempDir(identifier: string, version?: string): Promise<string> {
			let tempInstallDir = temp.mkdirSync("pluginInstallation");
			try {
				// Create package.json in the temp directory in order to be sure that the package will be installed inside <temp_dir>/node_modules
				let packageJsonData = {
					name: "tempPackage",
					version: "1.0.0"
				};
				this.$fs.writeJson(path.join(tempInstallDir, this.$projectConstants.PACKAGE_JSON_NAME), packageJsonData);
				if (version) {
					identifier = `${identifier}@${version}`;
				}

				let npmInstallOutput: string = await  this.$childProcess.exec(`npm install ${identifier} --production --ignore-scripts`, { cwd: tempInstallDir });
				let pathToPackage = path.join(tempInstallDir, NODE_MODULES_DIR_NAME);

				if (this.$fs.exists(pathToPackage)) {
					// Most probably the package is installed inside node_modules dir in temp folder.
					let dirs = this.$fs.readDirectory(pathToPackage).filter(dirName => dirName !== ".bin");
					// In case npm3 is installed on user's machine and the package has dependencies, there will be more than one dir, so we cannot be sure which one is ours.
					if (dirs.length === 1) {
						let pathToPlugin = path.join(pathToPackage, _.first(dirs));
						this.removeFetchedPluginDependencies(pathToPlugin);
						return pathToPlugin;
					}
				}

				// output is something like: tempPackage@1.0.0 C:\Users\VLADIM~1\AppData\Local\Temp\1\nativeScriptPluginInstallation116013-39060-jpwbm9
				//                           └── plugin-var-plugin@1.0.0  extraneous
				let npm2OutputMatch = npmInstallOutput.match(/.*?tempPackage@1\.0\.0.*?\r?\n.*?\s+?(.*?)@.*?\s+?/m);
				if (npm2OutputMatch) {
					let pathToPlugin = path.join(tempInstallDir, NODE_MODULES_DIR_NAME, npm2OutputMatch[1]);
					this.removeFetchedPluginDependencies(pathToPlugin);
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
					this.removeFetchedPluginDependencies(pathToPlugin);
					return pathToPlugin;
				}
			} catch (err) {
				// Uncomment when all of our marketplace plugins have package.json
				// this.$logger.trace(err);
				throw err;
			}

			return null;
	}

	protected async installLocalPlugin(pluginPath: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): Promise<IBasicPluginInformation> {
			// In case the user tries to add plugin from local directory we should check if the original directory is part of the project instead of the directory in Temp.
			let pathToPlugin = (options && options.useOriginalPluginDirectory) ? options.originalPluginDirectory : path.resolve(pluginPath);

			// In case the plugin is not part of the project or it is under node_modules, copy it to plugins
			if (this.shouldCopyToPluginsDirectory(pathToPlugin)) {
				let copyLocalPluginData = this.getCopyLocalPluginData(pathToPlugin);

				let pathToInstall = copyLocalPluginData.destinationDirectory;

				if (!pluginData || !pluginData.suppressMessage) {
					let actualPlugin = pluginData ? path.resolve(pluginData.actualName) : pluginPath;
					this.$logger.printMarkdown(util.format("Copying `%s` to `%s` in order to be able to use the plugin in your project.", actualPlugin, pathToInstall));
				}

				// use cp instead of mv, as it would fail if pathToInstalledPlugin is mounted
				// on a different device from the pluginsPath with error:
				// Error: EXDEV, cross-device link not permitted
				this.$fs.ensureDirectoryExists(pathToInstall);
				shelljs.cp("-Rf", copyLocalPluginData.sourceDirectory, pathToInstall);
				pathToPlugin = pathToInstall;
			}

			await return this.installLocalPluginCore(pathToPlugin, pluginData);
	}

	protected getCopyLocalPluginData(pathToPlugin: string): NpmPlugins.ICopyLocalPluginData {
		let lastIndexOfNodeModules = pathToPlugin.lastIndexOf(NODE_MODULES_DIR_NAME);
		// We need to get the exact plugin directory relative to the node_modules directory because if we try to fetch scoped dependency for example @angular/core the plugin will not be in node_modeules/core but in node_modules/@angular/core.
		let targetPluginDirectory = lastIndexOfNodeModules !== -1 ? pathToPlugin.substring(lastIndexOfNodeModules + NODE_MODULES_DIR_NAME.length) : path.basename(pathToPlugin);
		return {
			sourceDirectory: path.join(pathToPlugin, path.sep, "*"),
			destinationDirectory: path.join(this.$project.getProjectDir(), "plugins", targetPluginDirectory)
		};
	}

	protected isPluginPartOfTheProject(pathToPlugin: string): boolean {
		return pathToPlugin.indexOf(this.$project.getProjectDir()) !== -1;
	}

	protected shouldCopyToPluginsDirectory(pluginPath: string): boolean {
		return !this.isPluginPartOfTheProject(pluginPath);
	}

	protected getDefaultPluginVersion(plugin: IPlugin): string {
		return (<IMarketplacePlugin>plugin).pluginVersionsData.DefaultVersion;
	}

	protected abstract fetchPluginBasicInformationCore(pathToInstalledPlugin: string, version: string, pluginData?: ILocalPluginData, options?: NpmPlugins.IFetchLocalPluginOptions): IFuture<IBasicPluginInformation>;

	protected abstract installLocalPluginCore(pluginPath: string, pluginOpts?: ILocalPluginData): IFuture<IBasicPluginInformation>;

	protected abstract getPluginsDirName(): string;

	protected abstract composeSearchQuery(keywords: string[]): string[];

	protected abstract validatePluginInformation(pathToPlugin: string): void;

	private async fetchPluginCore(pluginIdentifier: string, version?: string, options?: NpmPlugins.IFetchLocalPluginOptions): Promise<string> {
			options = options === undefined ? { useOriginalPluginDirectory: false } : options;

			let pluginBasicInfo: IBasicPluginInformation;
			let pluginLocalPath = path.resolve(pluginIdentifier);
			let pluginLocalPathExists = this.$fs.exists(pluginLocalPath);
			let suppressMessage = pluginLocalPathExists && (pluginLocalPath.indexOf(this.$project.getProjectDir()) === -1 || pluginLocalPath.indexOf(this.getPluginsDirName()) !== -1);

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

			pluginBasicInfo = await  this.fetchPluginBasicInformation(pluginId, version, "fetch", pluginData, options);

			return pluginBasicInfo.name;
	}

	private isLocalPath(pluginId: string): boolean {
		return this.$fs.exists(pluginId);
	}

	private isUrlToRepository(pluginId: string): boolean {
		return validUrl.isUri(pluginId);
	}

	private removeFetchedPluginDependencies(pathToPlugin: string): void {
		let dependenciesDirectory = path.join(pathToPlugin, NODE_MODULES_DIR_NAME);

		return this.$fs.deleteDirectory(dependenciesDirectory);
	}
}

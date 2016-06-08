import * as path from "path";
import semver = require("semver");
import * as helpers from "../helpers";

class RenamedPlugin {
	constructor(public version: string,
		public oldName: string,
		public newName: string) {
	}
}

class MigrationData {
	constructor(public renamedPlugins: RenamedPlugin[],
		public supportedVersions: string[],
		public integratedPlugins: { [version: string]: string[] },
		public supportedFrameworkVersions: IFrameworkVersion[],
		public corePluginRegex: string) {
	}
}

export class CordovaMigrationService implements ICordovaMigrationService {
	private static CORDOVA_JSON_FILE_NAME = "cordova.json";
	private static CORDOVA_FOLDER_NAME = "Cordova";

	private _migrationData: MigrationData;
	private minSupportedVersion: string = "3.0.0";
	private invalidMarketplacePlugins: string[] = [];
	private cordovaMigrationFile: string = path.join(__dirname, "../../resources/Cordova", "cordova-migration-data.json");

	constructor(private $cordovaResources: ICordovaResourceLoader,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $loginManager: ILoginManager,
		private $mobileHelper: Mobile.IMobileHelper,
		private $pluginsService: IPluginsService,
		private $project: Project.IProject,
		private $projectConstants: Project.IConstants,
		private $projectPropertiesService: IProjectPropertiesService,
		private $prompter: IPrompter,
		private $resources: IResourceLoader,
		private $server: Server.IServer,
		private $serverConfiguration: IServerConfiguration,
		private $webViewService: IWebViewService) { }

	private get migrationData(): IFuture<MigrationData> {
		return (() => {
			if (!this._migrationData) {
				this._migrationData = this.$fs.readJson(this.cordovaMigrationFile).wait();
			}

			return this._migrationData;
		}).future<MigrationData>()();
	}

	public getCordovaJsonData(): IFuture<ICordovaJsonData> {
		return this.$fs.readJson(this.cordovaJsonFilePath);
	}

	public getDisplayNameForVersion(version: string): IFuture<string> {
		return ((): string => {
			let supportedFrameworks: IFrameworkVersion[] = this.getSupportedFrameworks().wait();
			let framework = _.find(supportedFrameworks, (fw: IFrameworkVersion) => fw.version === version);
			if (framework) {
				return framework.displayName;
			}

			this.$logger.error(`Version ${version} in not supported.`);
			return null;
		}).future<string>()();
	}

	public getSupportedFrameworks(): IFuture<IFrameworkVersion[]> {
		return (() => {

			return this.migrationData.wait().supportedFrameworkVersions;

		}).future<IFrameworkVersion[]>()();
	}

	public getSupportedVersions(): IFuture<string[]> {
		return (() => {
			return this.migrationData.wait().supportedVersions;
		}).future<string[]>()();
	}

	public pluginsForVersion(version: string): IFuture<string[]> {
		return (() => {
			return this.migrationData.wait().integratedPlugins[version] || [];
		}).future<string[]>()();
	}

	public migratePlugins(plugins: string[], fromVersion: string, toVersion: string): IFuture<string[]> {
		return (() => {
			let isUpgrade = helpers.versionCompare(fromVersion, toVersion) < 0;
			let smallerVersion = isUpgrade ? fromVersion : toVersion;
			let biggerVersion = isUpgrade ? toVersion : fromVersion;

			let renames = _.select(this.migrationData.wait().renamedPlugins, (renamedPlugin: RenamedPlugin) => {
				return helpers.versionCompare(smallerVersion, renamedPlugin.version) <= 0 && helpers.versionCompare(renamedPlugin.version, biggerVersion) <= 0;
			}).sort((a, b) => helpers.versionCompare(a.version, b.version) * (isUpgrade ? 1 : -1));

			let transitions = _.map(renames, rename => isUpgrade ? { from: rename.oldName, to: rename.newName } : { from: rename.newName, to: rename.oldName });

			plugins = this.applyTransitions(plugins, transitions);

			let supportedPlugins = this.pluginsForVersion(toVersion).wait();
			plugins = _.filter(plugins, plugin => _.contains(supportedPlugins, plugin) || (_.contains(plugin, '@') && !_.contains(this.invalidMarketplacePlugins, plugin)));

			let cordovaJsonData = this.getCordovaJsonData().wait();
			let sourceSupportedPlugins = this.pluginsForVersion(fromVersion).wait();
			let sourceSupportedPluginsRenamed = this.applyTransitions(sourceSupportedPlugins, transitions);
			let defaultEnabledPluginsIncludeRegex = new RegExp(cordovaJsonData.defaultEnabledPluginsIncludeRegex);
			let defaultEnabledPluginsExcludeRegex = new RegExp(cordovaJsonData.defaultEnabledPluginsExcludeRegex);
			let newEnabledPlugins = _(supportedPlugins)
				.filter(p => p.match(defaultEnabledPluginsIncludeRegex) && !p.match(defaultEnabledPluginsExcludeRegex))
				.difference(sourceSupportedPluginsRenamed)
				.value();

			return _.union(plugins, newEnabledPlugins);
		}).future<string[]>()();
	}

	public downloadMigrationData(): IFuture<void> {
		return (() => {
			let json = this.$server.cordova.getMigrationData().wait();
			let renamedPlugins = _.map(json.RenamedPlugins, (plugin: any) => new RenamedPlugin(
				this.parseMscorlibVersion(plugin.Version),
				plugin.OldName,
				plugin.NewName));

			let supportedVersions = _.map(json.SupportedVersions, plugin => this.parseMscorlibVersion(plugin));
			let cliSupportedVersions = _.select(supportedVersions, (version: string) => helpers.versionCompare(version, this.minSupportedVersion) >= 0);

			let integratedPlugins: { [version: string]: string[] } = {};
			_.each(cliSupportedVersions, version => {
				integratedPlugins[version] = json.IntegratedPlugins[version];
			});
			let supportedFrameworkVersion: IFrameworkVersion[] = _(json.SupportedFrameworkVersions)
				.map(fv => { return { displayName: fv.DisplayName, version: this.parseMscorlibVersion(fv.Version) }; })
				.filter(fv => _.contains(cliSupportedVersions, fv.version))
				.value();
			this._migrationData = new MigrationData(renamedPlugins, cliSupportedVersions, integratedPlugins, supportedFrameworkVersion, (<any>json).CorePluginRegex);
			this.$fs.writeJson(this.cordovaMigrationFile, this._migrationData).wait();

			this.downloadCordovaJsonFile().wait();
		}).future<void>()();
	}

	private downloadCordovaJsonFile(): IFuture<void> {
		return (() => {
			let file = this.$fs.createWriteStream(this.cordovaJsonFilePath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");

			let cordovaJsonPath = `${this.$serverConfiguration.resourcesPath.wait()}/cordova/cordova.json`;
			this.$httpClient.httpRequest({ url: cordovaJsonPath, pipeTo: file }).wait();
			fileEnd.wait();
		}).future<void>()();
	}

	public onWPSdkVersionChanging(newVersion: string): IFuture<void> {
		return ((): void => {
			if (newVersion === this.$project.projectData["WPSdk"]) {
				return;
			}

			let validWPSdks = this.getSupportedWPFrameworks().wait();
			if (!_.contains(validWPSdks, newVersion)) {
				this.$errors.failWithoutHelp("The selected version %s is not supported. Supported versions are %s", newVersion, validWPSdks.join(", "));
			}

			this.$logger.info("Migrating to WPSdk version %s", newVersion);
			if (helpers.versionCompare(newVersion, "8.0") > 0) {
				// at least Cordova 3.7 is required
				if (helpers.versionCompare(this.$project.projectData.FrameworkVersion, "3.7.0") < 0) {
					let cordovaVersions = this.getSupportedFrameworks().wait();

					// Find last framework which is not experimental.
					let selectedFramework = _.findLast(cordovaVersions, cv => cv.displayName.indexOf(this.$projectConstants.EXPERIMENTAL_TAG) === -1);
					if (helpers.versionCompare(selectedFramework.version, "3.7.0") < 0) {
						// if latest stable framework version is below 3.7.0, find last 'Experimental'.
						selectedFramework = _.findLast(cordovaVersions, cv => cv.displayName.indexOf(this.$projectConstants.EXPERIMENTAL_TAG) !== -1 && helpers.versionCompare("3.7.0", cv.version) <= 0);
					}

					let promptStr = `You cannot build with the Windows Phone ${newVersion} SDK with the currently selected target version of Apache Cordova. Do you want to switch to ${selectedFramework.displayName}?`;
					let shouldUpdateFramework = this.$prompter.confirm(promptStr).wait();
					if (shouldUpdateFramework) {
						this.onFrameworkVersionChanging(selectedFramework.version).wait();
						this.$project.projectData.FrameworkVersion = selectedFramework.version;
					} else {
						this.$errors.failWithoutHelp("Unable to set Windows Phone %s as the target SDK. Migrate to Apache Cordova 3.7.0 or later and try again.", newVersion);
					}
				}
			}
		}).future<void>()();
	}

	public onFrameworkVersionChanging(newVersion: string): IFuture<void> {
		return ((): void => {
			if (newVersion === this.$project.projectData.FrameworkVersion) {
				return;
			}

			let versionDisplayName = this.getDisplayNameForVersion(newVersion).wait();
			this.$project.ensureAllPlatformAssets().wait();

			if (this.$project.projectData.WPSdk && helpers.versionCompare(this.$project.projectData.WPSdk, "8.0") > 0 && helpers.versionCompare(newVersion, "3.7.0") < 0) {
				let shouldUpdateWPSdk = this.$prompter.confirm(`You cannot build with the Windows Phone ${this.$project.projectData.WPSdk} SDK with the currently selected target version of Apache Cordova. Do you want to switch to Windows Phone 8.0 SDK?`).wait();
				if (shouldUpdateWPSdk) {
					this.onWPSdkVersionChanging("8.0").wait();
					this.$project.projectData.WPSdk = "8.0";
				} else {
					this.$errors.failWithoutHelp("Unable to set %s as the target Apache Cordova version. Set the target Windows Phone SDK to 8.0 and try again.", newVersion);
				}
			}

			this.$logger.info("Migrating to Cordova version %s", versionDisplayName);
			let oldVersion = this.$project.projectData.FrameworkVersion;
			let availablePlugins = this.$pluginsService.getAvailablePlugins();
			this.invalidMarketplacePlugins = _(this.$project.configurations)
				.map(configuration => <string[]>this.$project.getProperty("CorePlugins", configuration))
				.union()
				.flatten<string>()
				.unique()
				.filter((plugin: string) => {
					let pluginBasicInformation = this.$pluginsService.getPluginBasicInformation(plugin).wait();
					return _.contains(plugin, '@') && !_.any(availablePlugins, pl => pl.data.Identifier.toLowerCase() === pluginBasicInformation.name.toLowerCase() && pl.data.Version === pluginBasicInformation.version);
				})
				.value();

			if (this.invalidMarketplacePlugins.length > 0) {
				this.promptUserForInvalidPluginsAction(this.invalidMarketplacePlugins, newVersion).wait();
			}

			let cordovaJsonData = this.getCordovaJsonData().wait();

			if (semver.gte(newVersion, cordovaJsonData.forceHardwareAccelerationAfter)) {
				this.$project.projectData.AndroidHardwareAcceleration = "true";
				this.$project.saveProject().wait();
			}

			_.each(this.invalidMarketplacePlugins, plugin => {
				let {name} = this.$pluginsService.getPluginBasicInformation(plugin).wait();
				this.$pluginsService.removePlugin(name).wait();
			});

			_.each(this.$project.configurations, (configuration: string) => {
				let oldPluginsList = this.$project.getProperty("CorePlugins", configuration);
				let newPluginsList = this.migratePlugins(oldPluginsList, oldVersion, newVersion).wait();
				this.$logger.trace("Migrated core plugins to: ", helpers.formatListOfNames(newPluginsList, "and"));
				this.$project.setProperty("CorePlugins", newPluginsList, configuration);
			});

			this.migrateCordovaJsFiles(newVersion).wait();

			this.$logger.info("Successfully migrated to version %s", versionDisplayName);
		}).future<void>()();
	}

	public getSupportedPlugins(): IFuture<string[]> {
		return (() => {
			let version: string;
			if (this.$project.projectData) {
				version = this.$project.projectData.FrameworkVersion;
			} else {
				let selectedFramework = _.findLast(this.getSupportedFrameworks().wait(), (sv: IFrameworkVersion) => sv.displayName.indexOf(this.$projectConstants.EXPERIMENTAL_TAG) === -1);
				version = selectedFramework.version;
			}

			return this.pluginsForVersion(version).wait();
		}).future<string[]>()();
	}

	private get cordovaJsonFilePath(): string {
		return path.join(this.$resources.resolvePath(CordovaMigrationService.CORDOVA_FOLDER_NAME), CordovaMigrationService.CORDOVA_JSON_FILE_NAME);
	}

	private migrateCordovaJsFiles(newVersion: string): IFuture<void> {
		return ((): void => {
			let backedUpFiles: string[] = [],
				backupSuffix = ".backup";
			try {
				_.each(this.$mobileHelper.platformNames, (platform) => {
					this.$logger.trace("Replacing cordova.js file for %s platform ", platform);
					let cordovaJsFileName = path.join(this.$project.getProjectDir().wait(), `cordova.${platform}.js`.toLowerCase());
					let cordovaJsSourceFilePath = this.$cordovaResources.buildCordovaJsFilePath(newVersion, platform);
					this.$fs.copyFile(cordovaJsFileName, cordovaJsFileName + backupSuffix).wait();
					backedUpFiles.push(cordovaJsFileName);
					this.$fs.copyFile(cordovaJsSourceFilePath, cordovaJsFileName).wait();
				});
			} catch (error) {
				_.each(backedUpFiles, file => {
					this.$logger.trace("Reverting %s", file);
					this.$fs.copyFile(file + backupSuffix, file).wait();
				});
				this.$errors.failWithoutHelp(error.message);
			}
			finally {
				_.each(backedUpFiles, file => {
					this.$fs.deleteFile(file + backupSuffix).wait();
				});
			}
		}).future<void>()();
	}

	private promptUserForInvalidPluginsAction(plugins: string[], toVersion: string): IFuture<void> {
		return (() => {
			let multipleInvalidPlugins = plugins.length > 1,
				remove = multipleInvalidPlugins ? `Remove those plugins from all configurations` : `Remove this plugin from all configurations`,
				cancel = 'Cancel Cordova migration',
				pluginsString = multipleInvalidPlugins ? `plugins ${plugins.join(', ')} are` : `plugin ${plugins.join(', ')} is`,
				choice = this.$prompter.promptForChoice(`The ${pluginsString} not supported for Cordova version ${toVersion}. What do you want to do?`, [remove, cancel]).wait();
			if (choice === cancel) {
				this.$errors.failWithoutHelp("Cordova migration interrupted");
			}
		}).future<void>()();
	}

	private getSupportedWPFrameworks(): IFuture<string[]> {
		return ((): string[] => {
			let validValues: string[] = [];
			let projectSchema = this.$project.getProjectSchema().wait();
			if (projectSchema) {
				validValues = this.$projectPropertiesService.getValidValuesForProperty(projectSchema["WPSdk"]).wait();
			}

			return validValues;
		}).future<string[]>()();
	}

	private parseMscorlibVersion(json: any): string {
		return [json._Major, json._Minor, json._Build].join('.');
	}

	private applyTransitions(plugins: string[], transitions: any[]): string[] {
		return _.map(plugins, plugin => {
			_.each(transitions, transition => {
				if (transition.from === plugin) {
					plugin = transition.to;
				}
			});

			return plugin;
		});
	}
}
$injector.register("cordovaMigrationService", CordovaMigrationService);

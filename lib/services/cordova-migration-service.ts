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
	private _resourceDownloader: IResourceDownloader;
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
		private $project: Project.IProject,
		private $projectConstants: Project.IConstants,
		private $projectPropertiesService: IProjectPropertiesService,
		private $prompter: IPrompter,
		private $resources: IResourceLoader,
		private $server: Server.IServer,
		private $serverConfiguration: IServerConfiguration,
		private $webViewService: IWebViewService,
		private $injector: IInjector) { }

	private get $pluginsService(): IPluginsService {
		return this.$injector.resolve("pluginsService");
	}

	private get migrationData(): MigrationData {
		if (!this._migrationData) {
			this._migrationData = this.$fs.readJson(this.cordovaMigrationFile);
		}

		return this._migrationData;
	}

	private get $resourceDownloader(): IResourceDownloader {
		if (!this._resourceDownloader) {
			this._resourceDownloader = this.$injector.resolve("resourceDownloader");
		}

		return this._resourceDownloader;
	}

	public getCordovaJsonData(): ICordovaJsonData {
		return this.$fs.readJson(this.cordovaJsonFilePath);
	}

	public getDisplayNameForVersion(version: string): string {
		let supportedFrameworks: IFrameworkVersion[] = this.getSupportedFrameworks();
		let framework = _.find(supportedFrameworks, (fw: IFrameworkVersion) => fw.version === version);
		if (framework) {
			return framework.displayName;
		}

		this.$logger.error(`Version ${version} in not supported.`);
		return null;
	}

	public getSupportedFrameworks(): IFrameworkVersion[] {
		return this.migrationData.supportedFrameworkVersions;
	}

	public getSupportedVersions(): string[] {
		return this.migrationData.supportedVersions;
	}

	public pluginsForVersion(version: string): string[] {
		return this.migrationData.integratedPlugins[version] || [];
	}

	public async migratePlugins(plugins: string[], fromVersion: string, toVersion: string): Promise<string[]> {
			let isUpgrade = helpers.versionCompare(fromVersion, toVersion) < 0;
			let smallerVersion = isUpgrade ? fromVersion : toVersion;
			let biggerVersion = isUpgrade ? toVersion : fromVersion;

			let renames = _.filter(this.migrationData.renamedPlugins, (renamedPlugin: RenamedPlugin) => {
				return helpers.versionCompare(smallerVersion, renamedPlugin.version) <= 0 && helpers.versionCompare(renamedPlugin.version, biggerVersion) <= 0;
			}).sort((a, b) => helpers.versionCompare(a.version, b.version) * (isUpgrade ? 1 : -1));

			let transitions = _.map(renames, rename => isUpgrade ? { from: rename.oldName, to: rename.newName } : { from: rename.newName, to: rename.oldName });

			plugins = this.applyTransitions(plugins, transitions);

			let supportedPlugins = this.pluginsForVersion(toVersion);
			plugins = _.filter(plugins, plugin => _.includes(supportedPlugins, plugin) || (_.includes(plugin, '@') && !_.includes(this.invalidMarketplacePlugins, plugin)));

			let cordovaJsonData = this.getCordovaJsonData();
			let sourceSupportedPlugins = this.pluginsForVersion(fromVersion);
			let sourceSupportedPluginsRenamed = this.applyTransitions(sourceSupportedPlugins, transitions);
			let defaultEnabledPluginsIncludeRegex = new RegExp(cordovaJsonData.defaultEnabledPluginsIncludeRegex);
			let defaultEnabledPluginsExcludeRegex = new RegExp(cordovaJsonData.defaultEnabledPluginsExcludeRegex);
			let newEnabledPlugins = _(supportedPlugins)
				.filter(p => p.match(defaultEnabledPluginsIncludeRegex) && !p.match(defaultEnabledPluginsExcludeRegex))
				.difference(sourceSupportedPluginsRenamed)
				.value();

			return _.union(plugins, newEnabledPlugins);
	}

	public async downloadMigrationData(): Promise<void> {
			let json = await  this.$server.cordova.getMigrationData();
			let renamedPlugins = _.map(json.RenamedPlugins, (plugin: any) => new RenamedPlugin(
				this.parseMscorlibVersion(plugin.Version),
				plugin.OldName,
				plugin.NewName));

			let supportedVersions = _.map(json.SupportedVersions, plugin => this.parseMscorlibVersion(plugin));
			let cliSupportedVersions = _.filter(supportedVersions, (version: string) => helpers.versionCompare(version, this.minSupportedVersion) >= 0);

			let integratedPlugins: { [version: string]: string[] } = {};
			_.each(cliSupportedVersions, version => {
				integratedPlugins[version] = json.IntegratedPlugins[version];
			});
			let supportedFrameworkVersion: IFrameworkVersion[] = _(json.SupportedFrameworkVersions)
				.map(fv => { return { displayName: fv.DisplayName, version: this.parseMscorlibVersion(fv.Version) }; })
				.filter(fv => _.includes(cliSupportedVersions, fv.version))
				.value();
			this._migrationData = new MigrationData(renamedPlugins, cliSupportedVersions, integratedPlugins, supportedFrameworkVersion, (<any>json).CorePluginRegex);
			this.$fs.writeJson(this.cordovaMigrationFile, this._migrationData);

			await this.downloadMigrationConfigFile();
	}

	public async downloadMigrationConfigFile(targetPath?: string): Promise<void> {
			let cordovaJsonPath = await  `${this.$serverConfiguration.resourcesPath}/cordova/cordova.json`;
			return this.$resourceDownloader.downloadResourceFromServer(cordovaJsonPath, targetPath || await  this.cordovaJsonFilePath);
	}

	public async onWPSdkVersionChanging(newVersion: string): Promise<void> {
			if (newVersion === this.$project.projectData["WPSdk"]) {
				return;
			}

			let validWPSdks = await  this.getSupportedWPFrameworks();
			if (!_.includes(validWPSdks, newVersion)) {
				this.$errors.failWithoutHelp("The selected version %s is not supported. Supported versions are %s", newVersion, validWPSdks.join(", "));
			}

			this.$logger.info("Migrating to WPSdk version %s", newVersion);
			if (helpers.versionCompare(newVersion, "8.0") > 0) {
				// at least Cordova 3.7 is required
				if (helpers.versionCompare(this.$project.projectData.FrameworkVersion, "3.7.0") < 0) {
					let cordovaVersions = this.getSupportedFrameworks();

					// Find last framework which is not experimental.
					let selectedFramework = _.findLast(cordovaVersions, cv => cv.displayName.indexOf(this.$projectConstants.EXPERIMENTAL_TAG) === -1);
					if (helpers.versionCompare(selectedFramework.version, "3.7.0") < 0) {
						// if latest stable framework version is below 3.7.0, find last 'Experimental'.
						selectedFramework = _.findLast(cordovaVersions, cv => cv.displayName.indexOf(this.$projectConstants.EXPERIMENTAL_TAG) !== -1 && helpers.versionCompare("3.7.0", cv.version) <= 0);
					}

					let promptStr = `You cannot build with the Windows Phone ${newVersion} SDK with the currently selected target version of Apache Cordova. Do you want to switch to ${selectedFramework.displayName}?`;
					let shouldUpdateFramework = await  this.$prompter.confirm(promptStr);
					if (shouldUpdateFramework) {
						await this.onFrameworkVersionChanging(selectedFramework.version);
						this.$project.projectData.FrameworkVersion = selectedFramework.version;
					} else {
						this.$errors.failWithoutHelp("Unable to set Windows Phone %s as the target SDK. Migrate to Apache Cordova 3.7.0 or later and try again.", newVersion);
					}
				}
			}
	}

	public async onFrameworkVersionChanging(newVersion: string): Promise<void> {
			if (newVersion === this.$project.projectData.FrameworkVersion) {
				return;
			}

			let versionDisplayName = this.getDisplayNameForVersion(newVersion);
			this.$project.ensureAllPlatformAssets();

			if (this.$project.projectData.WPSdk && helpers.versionCompare(this.$project.projectData.WPSdk, "8.0") > 0 && helpers.versionCompare(newVersion, "3.7.0") < 0) {
				let shouldUpdateWPSdk = await  this.$prompter.confirm(`You cannot build with the Windows Phone ${this.$project.projectData.WPSdk} SDK with the currently selected target version of Apache Cordova. Do you want to switch to Windows Phone 8.0 SDK?`);
				if (shouldUpdateWPSdk) {
					await this.onWPSdkVersionChanging("8.0");
					this.$project.projectData.WPSdk = "8.0";
				} else {
					this.$errors.failWithoutHelp("Unable to set %s as the target Apache Cordova version. Set the target Windows Phone SDK to 8.0 and try again.", newVersion);
				}
			}

			this.$logger.info("Migrating to Cordova version %s", versionDisplayName);
			let oldVersion = this.$project.projectData.FrameworkVersion;
			let availablePlugins = this.$pluginsService.getAvailablePlugins();

			await this.migrateWebView(oldVersion, newVersion);

			this.invalidMarketplacePlugins = _(this.$project.configurations)
				.map(configuration => <string[]>this.$project.getProperty("CorePlugins", configuration))
				.union()
				.flatten<string>()
				.uniq()
				.filter((plugin: string) => {
					let pluginBasicInformation = await  this.$pluginsService.getPluginBasicInformation(plugin);
					return _.includes(plugin, '@') && !_.some(availablePlugins, pl => pl.data.Identifier.toLowerCase() === pluginBasicInformation.name.toLowerCase() && pl.data.Version === pluginBasicInformation.version);
				})
				.value();

			if (this.invalidMarketplacePlugins.length > 0) {
				await this.promptUserForInvalidPluginsAction(this.invalidMarketplacePlugins, newVersion);
			}

			let cordovaJsonData = this.getCordovaJsonData();

			if (semver.gte(newVersion, cordovaJsonData.forceHardwareAccelerationAfter)) {
				this.$project.projectData.AndroidHardwareAcceleration = "true";
				this.$project.saveProject();
			}

			_.each(this.invalidMarketplacePlugins, plugin => {
				let name = (await  this.$pluginsService.getPluginBasicInformation(plugin)).name;
				await this.$pluginsService.removePlugin(name);
			});

			_.each(this.$project.configurations, (configuration: string) => {
				let oldPluginsList = this.$project.getProperty("CorePlugins", configuration);
				let newPluginsList = await  this.migratePlugins(oldPluginsList, oldVersion, newVersion);
				this.$logger.trace("Migrated core plugins to: ", helpers.formatListOfNames(newPluginsList, "and"));
				this.$project.setProperty("CorePlugins", newPluginsList, configuration);
			});

			this.migrateCordovaJsFiles(newVersion);

			this.$logger.info("Successfully migrated to version %s", versionDisplayName);
	}

	public getSupportedPlugins(): string[] {
		let version: string;
		if (this.$project.projectData) {
			version = this.$project.projectData.FrameworkVersion;
		} else {
			let selectedFramework = _.findLast(this.getSupportedFrameworks(), (sv: IFrameworkVersion) => sv.displayName.indexOf(this.$projectConstants.EXPERIMENTAL_TAG) === -1);
			version = selectedFramework.version;
		}

		return this.pluginsForVersion(version);
	}

	private get cordovaJsonFilePath(): string {
		return path.join(this.$resources.resolvePath(CordovaMigrationService.CORDOVA_FOLDER_NAME), CordovaMigrationService.CORDOVA_JSON_FILE_NAME);
	}

	private migrateCordovaJsFiles(newVersion: string): void {
		let backedUpFiles: string[] = [],
			backupSuffix = ".backup";
		try {
			_.each(this.$mobileHelper.platformNames, (platform) => {
				this.$logger.trace("Replacing cordova.js file for %s platform ", platform);
				let cordovaJsFileName = path.join(this.$project.getProjectDir(), `cordova.${platform}.js`.toLowerCase());
				let cordovaJsSourceFilePath = this.$cordovaResources.buildCordovaJsFilePath(newVersion, platform);
				this.$fs.copyFile(cordovaJsFileName, cordovaJsFileName + backupSuffix);
				backedUpFiles.push(cordovaJsFileName);
				this.$fs.copyFile(cordovaJsSourceFilePath, cordovaJsFileName);
			});
		} catch (error) {
			_.each(backedUpFiles, file => {
				this.$logger.trace("Reverting %s", file);
				this.$fs.copyFile(file + backupSuffix, file);
			});
			this.$errors.failWithoutHelp(error.message);
		}
		finally {
			_.each(backedUpFiles, file => {
				this.$fs.deleteFile(file + backupSuffix);
			});
		}
	}

	private async promptUserForInvalidPluginsAction(plugins: string[], toVersion: string): Promise<void> {
			let multipleInvalidPlugins = plugins.length > 1,
				remove = multipleInvalidPlugins ? `Remove those plugins from all configurations` : `Remove this plugin from all configurations`,
				cancel = 'Cancel Cordova migration',
				pluginsString = multipleInvalidPlugins ? `plugins ${plugins.join(', ')} are` : `plugin ${plugins.join(', ')} is`,
				choice = await  this.$prompter.promptForChoice(`The ${pluginsString} not supported for Cordova version ${toVersion}. What do you want to do?`, [remove, cancel]);
			if (choice === cancel) {
				this.$errors.failWithoutHelp("Cordova migration interrupted");
			}
	}

	private async getSupportedWPFrameworks(): Promise<string[]> {
			let validValues: string[] = [];
			let projectSchema = await  this.$project.getProjectSchema();
			if (projectSchema) {
				validValues = await  this.$projectPropertiesService.getValidValuesForProperty(projectSchema["WPSdk"]);
			}

			return validValues;
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

	private async migrateWebView(oldFrameworkVersion: string, newFrameworkVersion: string): Promise<void> {
			// For Cordova versions below 5.0.0 with WKWebView we need to set the WKWebView to com.telerik.plugins.wkwebview.
			// For Cordova version 5.0.0 and above with WKWebView we need to set the WKWebView to cordova-plugin-wkwebview-engine.
			let currentWebViewName = await this.$webViewService.getCurrentWebViewName(this.$projectConstants.IOS_PLATFORM_NAME);
			let currentWebView = this.$webViewService.getWebView(this.$projectConstants.IOS_PLATFORM_NAME, currentWebViewName, oldFrameworkVersion);
			let newWebView = this.$webViewService.getWebView(this.$projectConstants.IOS_PLATFORM_NAME, currentWebViewName, newFrameworkVersion);

			if (newWebView.pluginIdentifier !== currentWebView.pluginIdentifier) {
				if (currentWebView.pluginIdentifier) {
					await this.$pluginsService.removePlugin(currentWebView.pluginIdentifier);
				}

				await this.$webViewService.enableWebView(this.$projectConstants.IOS_PLATFORM_NAME, currentWebViewName, newFrameworkVersion);
			}
	}
}
$injector.register("cordovaMigrationService", CordovaMigrationService);

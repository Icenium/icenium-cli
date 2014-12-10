///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");
import helpers = require("./../helpers");

class RenamedPlugin {
	constructor(public version: string,
		public oldName: string,
		public newName: string) {
	}
}

class MigrationData {
	constructor(public renamedPlugins: RenamedPlugin[],
		public supportedVersions: string[],
		public integratedPlugins: { [version: string]: string[] }) {
	}
}

export class FrameworkVersion implements Server.FrameworkVersion {
	constructor(public DisplayName: string,
		public Version: string) { }
}

export class CordovaMigrationService implements ICordovaMigrationService {
	private _migrationData: MigrationData;
	private minSupportedVersion: string = "3.0.0";
	private cordovaMigrationFile: string = path.join(__dirname, "../../resources/Cordova", "cordova-migration-data.json");

	constructor(private $fs: IFileSystem,
		private $server: Server.IServer,
		private $errors: IErrors,
		private $loginManager:ILoginManager) {
	}

	private get migrationData(): IFuture<MigrationData> {
		return (() => {
			if(!this._migrationData) {
				this._migrationData = this.$fs.readJson(this.cordovaMigrationFile).wait();
			}

			return this._migrationData;
		}).future<MigrationData>()();
	}

	public getDisplayNameForVersion(version: string): IFuture<string> {
		return ((): string => {
			var framework = _.find(this.getSupportedFrameworks().wait(), (fw: Server.FrameworkVersion) => fw.Version === version);
			if(framework) {
				return framework.DisplayName;
			}

			this.$errors.fail("Cannot find version %s in the supported versions.", version);
		}).future<string>()();
	}

	public getSupportedFrameworks(): IFuture<Server.FrameworkVersion[]> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			var cliSupportedVersions: Server.FrameworkVersion[] = [];
			_.each(this.$server.cordova.getCordovaFrameworkVersions().wait(), (fw: Server.FrameworkVersion) => {
				var version = this.parseMscorlibVersion(fw.Version);
				if(helpers.versionCompare(version, this.minSupportedVersion) >= 0) {
					cliSupportedVersions.push(new FrameworkVersion(fw.DisplayName, version));
				}
			});

			return cliSupportedVersions;
		}).future<Server.FrameworkVersion[]>()();
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
			var isUpgrade = helpers.versionCompare(fromVersion, toVersion) < 0;
			var smallerVersion = isUpgrade ? fromVersion : toVersion;
			var biggerVersion = isUpgrade ? toVersion : fromVersion;

			var renames = _.select(this.migrationData.wait().renamedPlugins, (renamedPlugin: RenamedPlugin) => {
				return helpers.versionCompare(smallerVersion, renamedPlugin.version) <= 0 && helpers.versionCompare(renamedPlugin.version, biggerVersion) <= 0
			}).sort((a, b) => helpers.versionCompare(a.version, b.version) * (isUpgrade ? 1 : -1));

			var transitions = _.map(renames, rename => isUpgrade ? { from: rename.oldName, to: rename.newName } : { from: rename.newName, to: rename.oldName });

			plugins = _.map(plugins, plugin => {
				_.each(transitions, transition => {
					if(transition.from == plugin) {
						plugin = transition.to;
					}
				});

				return plugin;
			});

			var supportedPlugins = this.pluginsForVersion(toVersion).wait();
			plugins = _.filter(plugins, plugin => _.contains(supportedPlugins, plugin));

			return plugins;
		}).future<string[]>()();
	}

	public downloadCordovaMigrationData(): IFuture<void> {
		return (() => {
			var json = this.$server.cordova.getMigrationData().wait();
			var renamedPlugins = _.map(json.RenamedPlugins, (plugin: any) => new RenamedPlugin(
				this.parseMscorlibVersion(plugin.Version),
				plugin.OldName,
				plugin.NewName));

			var supportedVersions = _.map(json.SupportedVersions, plugin => this.parseMscorlibVersion(plugin));
			var cliSupportedVersions = _.select(supportedVersions, (version: string) => helpers.versionCompare(version, this.minSupportedVersion) >= 0);

			var integratedPlugins: { [version: string]: string[] } = {};
			_.each(cliSupportedVersions, version => {
				integratedPlugins[version] = json.IntegratedPlugins[version];
			});

			this._migrationData = new MigrationData(renamedPlugins, cliSupportedVersions, integratedPlugins)
			this.$fs.writeJson(this.cordovaMigrationFile, this._migrationData).wait();
		}).future<void>()();
	}

	private parseMscorlibVersion(json: any): string {
		return [json._Major, json._Minor, json._Build].join('.');
	}
}
$injector.register("cordovaMigrationService", CordovaMigrationService);


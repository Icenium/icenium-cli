///<reference path="../.d.ts"/>
"use strict";

import xmlMapping = require("xml-mapping");
import Future = require("fibers/future");
import path = require("path");
import util = require("util");
import options = require("./../options");
import helpers = require("./../helpers");

export class ClientSpecificUserSettingsService implements IUserSettingsService {
	private userSettingsFile = null;
	private userSettingsData: any = null;

	constructor(private $fs: IFileSystem) { }

	private loadUserSettingsFile(): IFuture<void> {
		return (() => {
			if(!this.userSettingsData) {
				this.userSettingsFile = path.join(options["profile-dir"], "user-settings.json");

				if(!this.$fs.exists(this.userSettingsFile).wait()) {
					this.$fs.writeFile(this.userSettingsFile, null).wait();
				}

				this.userSettingsData = this.$fs.readJson(this.userSettingsFile).wait();
			}
		}).future<void>()();
	}

	public getValue(propertyName: string): IFuture<any> {
		return(() => {
			this.loadUserSettingsFile().wait();
			return this.userSettingsData ? this.userSettingsData[propertyName] : null;
		}).future<any>()();
	}

	public saveSettings(data: {[key: string]: {}}): IFuture<void> {
		return(() => {
			this.loadUserSettingsFile().wait();
			this.userSettingsData = this.userSettingsData || {};

			Object.keys(data).forEach(propertyName => {
				this.userSettingsData[propertyName] = data[propertyName];
			});

			this.$fs.writeJson(this.userSettingsFile, this.userSettingsData, "\t").wait();
		}).future<void>()();
	}

	public deleteUserSettingsFile(): IFuture<void> {
		return this.$fs.deleteDirectory(this.userSettingsFile);
	}
}
$injector.register("clientSpecificUserSettingsService", ClientSpecificUserSettingsService);

export  class SharedUserSettingsService implements IUserSettingsService {
	private userSettingsData: any = null;

	private static SETTINGS_ROOT_TAG = "JustDevelopSettings";

	constructor(private $fs: IFileSystem,
		private $server: Server.IServer) { }

	public get userSettingsFile(): string {
		return path.join(options["profile-dir"], "user-settings.xml");
	}

	private loadUserSettingsFile(): IFuture<void> {
		return(() => {
			if(!this.userSettingsData) {
				var loginManager = $injector.resolve("loginManager"); //We need to resolve loginManager here due to cyclic dependency
				if (loginManager.isLoggedIn().wait()) {
					this.$fs.createDirectory(options["profile-dir"]).wait();

					if(this.$fs.exists(this.userSettingsFile).wait()) {
						var fileInfo = this.$fs.getFsStats(this.userSettingsFile).wait();
						var timeDiff = Math.abs(new Date().getTime() - fileInfo.mtime.getTime());
						var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
						if(diffDays > 1) {
							this.downloadUserSettings().wait();
						} else {
							this.userSettingsData = xmlMapping.tojson(this.$fs.readText(this.userSettingsFile).wait());
						}
					} else {
						this.downloadUserSettings().wait();
					}
				}
			}
		}).future<void>()();
	}

	private downloadUserSettings(): IFuture<void> {
		return(() => {
			try {
				this.$server.rawSettings.getUserSettings(this.$fs.createWriteStream(this.userSettingsFile)).wait();
				this.userSettingsData = xmlMapping.tojson(this.$fs.readText(this.userSettingsFile).wait());
			} catch(error) {
				if(error.response && error.response.statusCode === 404) {
					this.userSettingsData = null;
				} else {
					throw error;
				}
			}
		}).future<void>()();
	}

	public getValue(propertyName: string): IFuture<any> {
		return (() => {
			this.loadUserSettingsFile().wait();

			if(!this.userSettingsData) {
				return null;
			}

			var data = this.userSettingsData[SharedUserSettingsService.SETTINGS_ROOT_TAG];
			try {
				propertyName.split(".").forEach(property => { data = data[property]; });
			} catch(e) {
				return null;
			}

			return data.$t || data;

		}).future<any>()();
	}

	public saveSettings(data: {[key: string]: {}}): IFuture<void> {
		return (() => {
			this.downloadUserSettings().wait();

			this.userSettingsData = this.userSettingsData || {};

			if(!this.userSettingsData.hasOwnProperty(SharedUserSettingsService.SETTINGS_ROOT_TAG)) {
				this.userSettingsData[SharedUserSettingsService.SETTINGS_ROOT_TAG] = {};
			}

			Object.keys(data).forEach(property => {
				var newPropertyName = property + ".$t";
				data[newPropertyName] = data[property];
				delete data[property];
			});

			var convertedData = require("string-to-json").convert(data);
			helpers.mergeRecursive(this.userSettingsData[SharedUserSettingsService.SETTINGS_ROOT_TAG], convertedData);

			var xml = xmlMapping.toxml(this.userSettingsData);
			this.$server.rawSettings.saveUserSettings(xml).wait();
			this.$fs.writeFile(this.userSettingsFile, xml).wait();

		}).future<void>()();
	}

	public deleteUserSettingsFile(): IFuture<void> {
		return this.$fs.deleteDirectory(this.userSettingsFile);
	}
}
$injector.register("sharedUserSettingsService", SharedUserSettingsService);


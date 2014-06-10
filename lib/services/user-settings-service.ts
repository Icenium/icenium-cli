///<reference path="../.d.ts"/>
"use strict";

import xmlMapping = require("xml-mapping");
import Future = require("fibers/future");
import path = require("path");
import util = require("util");
import options = require("./../options");
import helpers = require("./../helpers");

export class ClientUserSettingsFileService implements IUserSettingsFileService {
	private userSettingsFile: string;

	constructor(private $fs: IFileSystem) {
		this.userSettingsFile = path.join(options["profile-dir"], "local-user-settings.json");
	}

	public get userSettingsFilePath(): string {
		return this.userSettingsFile;
	}

	public deleteUserSettingsFile(): IFuture<void> {
		return this.$fs.deleteFile(this.userSettingsFilePath);
	}
}
$injector.register("clientUserSettingsFileService", ClientUserSettingsFileService);

export class ClientSpecificUserSettingsService implements IUserSettingsService {
	private userSettingsData: any = null;

	constructor(private $fs: IFileSystem,
		private $clientUserSettingsFileService: IUserSettingsFileService) { }

	public loadUserSettingsFile(): IFuture<void> {
		return (() => {
			if(!this.userSettingsData) {
				if(!this.$fs.exists(this.$clientUserSettingsFileService.userSettingsFilePath).wait()) {
					this.$fs.writeFile(this.$clientUserSettingsFileService.userSettingsFilePath, null).wait();
				}

				this.userSettingsData = this.$fs.readJson(this.$clientUserSettingsFileService.userSettingsFilePath).wait();
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

			this.$fs.writeJson(this.$clientUserSettingsFileService.userSettingsFilePath, this.userSettingsData, "\t").wait();
		}).future<void>()();
	}
}
$injector.register("clientSpecificUserSettingsService", ClientSpecificUserSettingsService);

export class SharedUserSettingsFileService implements IUserSettingsFileService {
	private userSettingsFile: string;

	constructor(private $fs: IFileSystem) {
		this.userSettingsFile = path.join(options["profile-dir"], "user-settings.xml");
	}

	public get userSettingsFilePath(): string {
		return this.userSettingsFile;
	}

	public deleteUserSettingsFile(): IFuture<void> {
		return this.$fs.deleteFile(this.userSettingsFilePath);
	}
}
$injector.register("sharedUserSettingsFileService", SharedUserSettingsFileService);

export  class SharedUserSettingsService implements IUserSettingsService {
	private userSettingsData: any = null;

	private static SETTINGS_ROOT_TAG = "JustDevelopSettings";

	constructor(private $fs: IFileSystem,
		private $server: Server.IServer,
		private $sharedUserSettingsFileService: IUserSettingsFileService,
		private $loginManager: ILoginManager) { }

	public loadUserSettingsFile(): IFuture<void> {
		return(() => {
			if(!this.userSettingsData) {
				this.$fs.createDirectory(options["profile-dir"]).wait();

				if(this.$fs.exists(this.$sharedUserSettingsFileService.userSettingsFilePath).wait()) {
					var fileInfo = this.$fs.getFsStats(this.$sharedUserSettingsFileService.userSettingsFilePath).wait();
					var timeDiff = Math.abs(new Date().getTime() - fileInfo.mtime.getTime());
					var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
					if(diffDays > 1) {
						this.downloadUserSettings().wait();
					} else {
						this.readUserSettingsFile().wait();
					}
				} else {
					this.downloadUserSettings().wait();
				}
			}
		}).future<void>()();
	}

	private downloadUserSettings(): IFuture<void> {
		return(() => {
			try {
				this.$server.rawSettings.getUserSettings(this.$fs.createWriteStream(this.$sharedUserSettingsFileService.userSettingsFilePath)).wait();
				this.userSettingsData = xmlMapping.tojson(this.$fs.readText(this.$sharedUserSettingsFileService.userSettingsFilePath).wait());
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
			this.$loginManager.ensureLoggedIn().wait();
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

	private readUserSettingsFile(): IFuture<void> {
		return(() => {
			this.userSettingsData = xmlMapping.tojson(this.$fs.readText(this.$sharedUserSettingsFileService.userSettingsFilePath).wait());
		}).future<void>()();
	}

	public saveSettings(data: {[key: string]: {}}): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			if (Object.keys(data).length !== 0) {
				this.downloadUserSettings().wait();
			} else {
				this.readUserSettingsFile().wait();
			}

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

			if (Object.keys(data).length !== 0) {
				this.$fs.writeFile(this.$sharedUserSettingsFileService.userSettingsFilePath, xml).wait();
			}
		}).future<void>()();
	}
}
$injector.register("sharedUserSettingsService", SharedUserSettingsService);


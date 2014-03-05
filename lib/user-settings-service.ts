///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import options = require("./options");

export class UserSettingsService implements IUserSettingsService {
	private userSettingsFile = null;
	private userSettingsData = {};

	constructor(private $fs: IFileSystem) {
		this.userSettingsFile = path.join(options["profile-dir"], "user");
	}

	private getUserSettingsFileSchema(): IFuture<any> {
		return (() => {
			var data = this.$fs.readText(this.userSettingsFile).wait();
			if(data) {
				this.userSettingsData = JSON.parse(data);
			}

			return this.userSettingsData;
		}).future<any>()();
	}

	public getValue(propertyName: string): IFuture<any> {
		return(() => {
			if(!this.$fs.exists(this.userSettingsFile).wait()) {
				return null;
			}

			this.getUserSettingsFileSchema().wait();

			return this.userSettingsData[propertyName];
		}).future<void>()();
	}

	public saveSettings(data: {[key: string]: {}}): IFuture<void> {
		return(() => {
			this.getUserSettingsFileSchema().wait();

			Object.keys(data).forEach(propertyName => {
				this.userSettingsData[propertyName] = data[propertyName];
			});

			this.$fs.writeJson(this.userSettingsFile, this.userSettingsData, "\t").wait();
		}).future<void>()();
	}
}
$injector.register("userSettingsService", UserSettingsService);

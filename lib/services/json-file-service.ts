///<reference path="../.d.ts"/>
"use strict";

import path = require("path");

export class JsonFileService implements IJsonFileService {
	private jsonData = {};

	constructor(private $fs: IFileSystem,
		private jsonFileName: string) { }

	private getFileSchema(): IFuture<any> {
		return (() => {
			var data = this.$fs.readJson(this.jsonFileName).wait();
			if(data) {
				this.jsonData = data;
			}
		}).future<void>()();
	}

	public getValue(propertyName: string): IFuture<any> {
		return(() => {
			if(!this.$fs.exists(this.jsonFileName).wait()) {
				return null;
			}
			this.getFileSchema().wait();

			return this.jsonData[propertyName];

		}).future<void>()();
	}

	public save(data: {[key: string]: {}}): IFuture<void> {
		return(() => {
			if(this.$fs.exists(this.jsonFileName).wait()) {
				this.getFileSchema().wait();
			}

			Object.keys(data).forEach(propertyName => {
				this.jsonData[propertyName] = data[propertyName];
			});

			this.$fs.writeJson(this.jsonFileName, this.jsonData, "\t").wait();

		}).future<void>()();
	}
}
$injector.register("jsonFileService", JsonFileService);
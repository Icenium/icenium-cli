///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import assert = require("assert");

export class JsonFileService implements IJsonFileService {
	private jsonData: any = null;
	private jsonFileName: string = null;

	constructor(private $fs: IFileSystem) { }

	public initialize(jsonFileName) {
		this.jsonFileName = jsonFileName;
	}

	private getFileSchema(): IFuture<void> {
		return (() => {
			assert.ok(this.jsonFileName, "JsonFileService not initialized");
			if(!this.jsonData) {
				if(this.$fs.exists(this.jsonFileName).wait()) {
					this.jsonData = this.$fs.readJson(this.jsonFileName).wait();
				}
			}
		}).future<void>()();
	}

	public getValue(propertyName: string): IFuture<any> {
		return(() => {
			this.getFileSchema().wait();
			return this.jsonData ? this.jsonData[propertyName] : null;
		}).future<any>()();
	}

	public save(data: {[key: string]: {}}): IFuture<void> {
		return(() => {
			this.getFileSchema().wait();
			this.jsonData = this.jsonData || {};

			Object.keys(data).forEach(propertyName => {
				this.jsonData[propertyName] = data[propertyName];
			});

			this.$fs.writeJson(this.jsonFileName, this.jsonData, "\t").wait();

		}).future<void>()();
	}
}
$injector.register("jsonFileService", JsonFileService);

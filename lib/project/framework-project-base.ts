///<reference path="../.d.ts"/>
"use strict";

import commonHelpers = require("./../common/helpers");
import options = require("./../options");
import path = require("path");
import util = require("util");

export class FrameworkProjectBase implements Project.IFrameworkProjectBase {
	private projectSchema: any;

	constructor(protected $logger: ILogger,
		protected $fs: IFileSystem,
		protected $resources: IResourceLoader) { }

	public alterPropertiesForNewProjectBase(properties: any, projectName: string): void {
		properties.DisplayName = projectName;
		var appid = options.appid;
		if(!options.appid) {
			appid = this.generateDefaultAppId(projectName);
			this.$logger.warn("--appid was not specified. Defaulting to " + appid)
		}

		properties.AppIdentifier = appid;

		properties.WP8ProductID = commonHelpers.createGUID();
		properties.WP8PublisherID = commonHelpers.createGUID();
	}

	public getProjectFileSchemaByName(name: string): IFuture<any> {
		var propPath = this.$resources.resolvePath(util.format("project-properties-%s.json", name.toLowerCase()));
		return this.$fs.readJson(propPath, "utf8");
	}

	public getFullProjectFileSchemaByName(name: string): IFuture<any> {
		return(() => {
			if (!this.projectSchema) {
				this.projectSchema = this.getProjectFileSchemaByName(name).wait();
				var commonSchema = this.getProjectFileSchemaByName("common").wait();
				_.extend(this.projectSchema, commonSchema);
			}
			return this.projectSchema;
		}).future<any>()();
	}

	public getProjectTargetsBase(dir: string, fileMask: RegExp): IFuture<string[]> {
		return (() => {
			var result: string[] = [];

			if (dir) {
				var files = this.$fs.readDirectory(dir).wait();
				var platformFiles = _.each(files, (file) => {
					var matches = file.match(fileMask);
					if(matches) {
						result.push(matches[1].toLowerCase());
					}
				});
			}

			return result;
		}).future<string[]>()();
	}

	_assetUpdateMessagePrinted = false;
	public printAssetUpdateMessage(): void {
		if (!this._assetUpdateMessagePrinted) {
			this.$logger.info("Setting up missing asset files. Commit these assets into your source control repository.");
			this._assetUpdateMessagePrinted = true;
		}
	}

	private generateDefaultAppId(appName: string): string {
		var sanitizedName = _.filter(appName.split(""), (c) => /[a-zA-Z0-9]/.test(c)).join("");
		if(sanitizedName) {
			if(/^\d+$/.test(sanitizedName)) {
				sanitizedName = "the" + sanitizedName;
			}
			return "com.telerik." + sanitizedName;
		} else {
			return "com.telerik.the";
		}
	}
}
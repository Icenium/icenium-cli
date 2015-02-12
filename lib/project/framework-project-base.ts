///<reference path="../.d.ts"/>
"use strict";

import commonHelpers = require("./../common/helpers");
import options = require("../common/options");

import path = require("path");
import util = require("util");

export class FrameworkProjectBase implements Project.IFrameworkProjectBase {
	private projectSchema: any;

	constructor(protected $logger: ILogger,
		protected $fs: IFileSystem,
		protected $resources: IResourceLoader,
		protected $errors: IErrors,
		protected $jsonSchemaValidator: IJsonSchemaValidator) { }

	public alterPropertiesForNewProjectBase(properties: any, projectName: string): void {
		properties.DisplayName = projectName;
		var appid = options.appid;
		if(!options.appid) {
			appid = this.generateDefaultAppId(projectName);
			this.$logger.warn("--appid was not specified. Defaulting to " + appid)
		}

		properties.AppIdentifier = appid;
	}

	public getProjectFileSchemaByName(name: string): IDictionary<any> {
		return this.$jsonSchemaValidator.tryResolveValidationSchema(name);
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

	public getProperty(propertyName: string, configuration: string, projectInformation: Project.IProjectInformation): any {
		var propertyValue: any = null;

		var configData = projectInformation.configurationSpecificData[configuration];
		if(configData && configData[propertyName]) {
			propertyValue = configData[propertyName];
		} else {
			propertyValue = projectInformation.projectData[propertyName];
		}

		return propertyValue;
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
///<reference path="../.d.ts"/>

"use strict";

import xml2js = require("xml2js");
import util = require("util");
import Future = require("fibers/future");
import helpers = require("../helpers");
import MobileHelper = require("../common/mobile/mobile-helper");

export class ProjectPropertiesService implements IProjectPropertiesService {
	constructor(private $fs: IFileSystem,
				private $resources: IResourceLoader,
				private $projectTypes: IProjectTypes) {
	}

	public getProjectProperties(projectFile: string, isJsonProjectFile: boolean): IFuture<IProjectData> {
		return ((): any => {
			var properties = isJsonProjectFile ? this.$fs.readJson(projectFile).wait() :
				this.getProjectPropertiesFromXmlProjectFile(projectFile).wait();

			this.completeProjectProperties(properties);

			return properties;
		}).future<IProjectData>()();
	}

	private getProjectPropertiesFromXmlProjectFile(projectFile: string): IFuture<any> {
		return ((): any => {
			var properties: any = {};

			var parser = new xml2js.Parser();
			var contents = this.$fs.readText(projectFile).wait();

			var parseString = Future.wrap((str, callback) => {
				return parser.parseString(str, callback);
			});

			var result: any = parseString(contents).wait();
			var propertyGroup: any = result.Project.PropertyGroup[0];

			var projectSchema = helpers.getProjectFileSchema(this.$projectTypes.Cordova).wait();
			_.sortBy(Object.keys(projectSchema), key => key === "FrameworkVersion" ? -1 : 1).forEach((propertyName) => {
				if (propertyGroup.hasOwnProperty(propertyName)) {
					properties[propertyName] = propertyGroup[propertyName][0];

					if (projectSchema[propertyName].flags) {
						properties[propertyName] = properties[propertyName] !== "" ? properties[propertyName].split(";") : [];
					}
				}
			});

			properties.ProjectName = propertyGroup.ProjectName[0];

			return properties;
		}).future<any>()();
	}

	public completeProjectProperties(properties: any): boolean {
		var updated = false;

		if (_.has(properties, "name")) {
			properties.ProjectName = properties.name;
			delete properties.name;
			updated = true;
		}

		if (_.has(properties, "iOSDisplayName")) {
			properties.DisplayName = properties.iOSDisplayName;
			delete properties.iOSDisplayName;
			updated = true;
		}
		if (!properties.DisplayName) {
			properties.DisplayName = properties.ProjectName;
			updated = true;
		}

		["WP8PublisherID", "WP8ProductID"].forEach((wp8guid) => {
			if (!_.has(properties, wp8guid)) {
				properties[wp8guid] = MobileHelper.generateWP8GUID();
				updated = true;
			}
		});

		if(!_.has(properties, "Framework")) {
			properties["Framework"] = this.$projectTypes[this.$projectTypes.Cordova];
			updated = true;
		}

		var defaultProject = this.$resources.readJson(
			util.format("default-project-%s.json", properties.Framework.toLowerCase())
		).wait();
		Object.keys(defaultProject).forEach((propName) => {
			if (!_.has(properties, propName)) {
				properties[propName] = defaultProject[propName];
				updated = true;
			}
		});

		return updated;
	}
}
$injector.register("projectPropertiesService", ProjectPropertiesService);

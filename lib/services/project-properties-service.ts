///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import xml2js = require("xml2js");
import util = require("util");
import Future = require("fibers/future");
import helpers = require("../helpers");
import MobileHelper = require("../common/mobile/mobile-helper");
import projectTypes = require("../project-types");

export class ProjectPropertiesService implements IProjectPropertiesService {
	constructor(private $fs: IFileSystem,
				private $errors: IErrors,
				private $injector: IInjector,
				private $resources: IResourceLoader) {
	}

	public getProjectProperties(projectFile: string, isJsonProjectFile: boolean): IFuture<IProjectData> {
		return ((): any => {
			var properties = isJsonProjectFile ? this.$fs.readJson(projectFile).wait() :
				this.getProjectPropertiesFromXmlProjectFile(projectFile).wait();

			if (properties) {
				this.completeProjectProperties(properties);
			}

			return properties;
		}).future<IProjectData>()();
	}

	public completeProjectProperties(properties: any): boolean {
		var updated = false;

		if(!_.has(properties, "Framework")) {
			properties["Framework"] = projectTypes[projectTypes.Cordova];
			updated = true;
		}

		if (properties["Framework"] !== projectTypes[projectTypes.MobileWebsite]) {
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
				if (!_.has(properties, wp8guid) || properties[wp8guid] === "") {
					properties[wp8guid] = MobileHelper.generateWP8GUID();
					updated = true;
				}
			});
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

	public updateProjectProperty(projectData: any, mode: string, property: string, newValue: any, propSchema: any, useMapping: boolean = true) : IFuture<void> {
		return ((): any => {
			property = this.normalizePropertyName(property, propSchema);
			var propData = propSchema[property];

			var validate = (condition: boolean, ...args: string[]) => {
				if(condition) {
					if(propData.validationMessage) {
						this.$errors.fail(propData.validationMessage);
					} else {
						this.$errors.fail.apply(this.$errors, _.rest(args, 0));
					}
				}
			};

			if (!propData) {
				this.$errors.fail("Unrecognized project property '%s'", property);
			}

			if (!propData.flags) {
				if (newValue.length !== 1) {
					this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
				}
				if (mode === "add" || mode === "del") {
					this.$errors.fail("Property '%s' is not a collection of flags. Use prop-set to set a property value.", property);
				}
			} else {
				newValue = _.flatten(_.map(newValue, (value: string)  => value.split(";")));
			}

			var range = this.getPropRange(propData).wait();
			if (range) {
				newValue = _.map(newValue, (value: string) => value.toLowerCase());

				var validValues: any;
				if (_.isArray(range)) {
					validValues = helpers.toHash(range, (value) => value.toLowerCase(), _.identity);
				} else {
					var keySelector = (value: any, key: string) => {
						var result: string;
						if (useMapping && value.input) {
							result = value.input;
						} else {
							result = key;
						}

						return result.toLowerCase();
					};

					validValues = helpers.toHash(range, keySelector, (value, key) => key);
				}

				var badValues = _.reject(newValue, (value: string) => validValues[value]);

				validate(badValues.length > 0, "Invalid property value%s for property '%s': '%s'", badValues.length > 1 ? "s" : "", property, badValues.join("; "));

				newValue = _.map(newValue, (value: string) => validValues[value]);
			}

			if (!propData.flags) {
				newValue = newValue[0];

				if (propData.regex) {
					var matchRegex = new RegExp(propData.regex);
					validate(!matchRegex.test(newValue), "Value '%s' is not in the format expected by property %s. Expected to match /%s/", newValue, property, propData.regex);
				}

				if (propData.validator) {
					var validator = this.$injector.resolve(propData.validator);
					validator.validate(newValue);
				}
			}

			var propertyValue = projectData[property];
			if (propData.flags && _.isString(propertyValue)) {
				propertyValue = propertyValue.split(";");
			}

			if (mode === "set") {
				propertyValue = newValue;
			} else if (mode === "del") {
				propertyValue = _.difference(propertyValue, newValue);
			} else if (mode === "add") {
				propertyValue = _.union(propertyValue, newValue);
			} else {
				this.$errors.fail("Unknown property update mode '%s'", mode);
			}

			if (propertyValue.sort) {
				propertyValue.sort();
			}

			if (propData.onChanging) {
				this.$injector.dynamicCall(propData.onChanging, [propertyValue]).wait();
			}

			projectData[property] = propertyValue;
		}).future<void>()();
	}

	public getProjectSchemaHelp(): IFuture<string> {
		return (() => {
			var result: string[] = [];
			var schema = helpers.getProjectFilePartSchema(projectTypes[projectTypes.Cordova]).wait();
			var title = util.format("Project properties for %s projects:", projectTypes[projectTypes.Cordova]);
			result.push(this.getProjectSchemaPartHelp(schema, title));

			schema = helpers.getProjectFilePartSchema(projectTypes[projectTypes.NativeScript]).wait();
			title = util.format("Project properties for %s projects:", projectTypes[projectTypes.NativeScript]);
			result.push(this.getProjectSchemaPartHelp(schema, title));

			schema = helpers.getProjectFilePartSchema(projectTypes[projectTypes.Common]).wait();
			title = "Common properties for all projects:";
			result.push(this.getProjectSchemaPartHelp(schema, title));

			return result.join(os.EOL + os.EOL);
		}).future<string>()();
	}

	public normalizePropertyName(property: string, schema: any): string {
		if (!property) {
			return property;
		}

		var propLookup = helpers.toHash(schema, (value, key) => key.toLowerCase(), (value, key) => key);
		return propLookup[property.toLowerCase()] || property;
	}

	private getProjectSchemaPartHelp(schema: string, title: string): string {
		var help = [title];
		_.each(schema, (value: any, key: any) => {
			help.push(util.format("  %s - %s", key, value.description));
			var range = this.getPropRange(value).wait();
			if (range) {
				help.push("    Valid values:");
				_.each(range, (rangeDesc:any, rangeKey:any) => {
					var desc = "      " + (_.isArray(range) ? rangeDesc : rangeDesc.input || rangeKey);
					if (rangeDesc.description) {
						desc += " - " + rangeDesc.description;
					}
					help.push(desc);
				});
			}
			if (value.validationMessage) {
				help.push("    " + value.validationMessage.replace(os.EOL, os.EOL + "    "));
			}
			else if (value.regex) {
				help.push("    Valid values match /" + value.regex.toString() + "/");
			}
		});

		return help.join(os.EOL);
	}

	private getPropRange(propData: any): IFuture<string[]>{
		return (() => {
			if (propData.dynamicRange) {
				return this.$injector.dynamicCall(propData.dynamicRange).wait();
			}
			return propData.range;
		}).future<string[]>()();
	}

	private getProjectPropertiesFromXmlProjectFile(projectFile: string): IFuture<any> {
		return ((): any => {
			var properties: any = {};

			var parser = new xml2js.Parser();
			var contents = this.$fs.readText(projectFile).wait();

			var parseString = Future.wrap((str:string, callback:(error: any, data: any) => void) => {
				return parser.parseString(str, callback);
			});

			var result: any = parseString(contents).wait();
			var propertyGroup: any = result.Project.PropertyGroup[0];

			var projectSchema = helpers.getProjectFileSchema(projectTypes.Cordova).wait();
			_.sortBy(Object.keys(projectSchema), key => key === "FrameworkVersion" ? -1 : 1).forEach((propertyName) => {
				if (propertyGroup.hasOwnProperty(propertyName)) {
					properties[propertyName] = propertyGroup[propertyName][0];

					if (projectSchema[propertyName].flags) {
						properties[propertyName] = properties[propertyName] !== "" ? properties[propertyName].split(";") : [];
					}
				}
			});

			// only old style .proj files (before project unification) have ProjectName
			if (propertyGroup.ProjectName) {
				properties.ProjectName = propertyGroup.ProjectName[0];
			} else {
				properties = null;
			}

			return properties;
		}).future<any>()();
	}
}
$injector.register("projectPropertiesService", ProjectPropertiesService);

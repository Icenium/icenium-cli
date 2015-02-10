///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import xmlMapping = require("xml-mapping");
import util = require("util");
import Future = require("fibers/future");
import helpers = require("../helpers");
import MobileHelper = require("../common/mobile/mobile-helper");

export class ProjectPropertiesService implements IProjectPropertiesService {
	constructor(private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $injector: IInjector,
		private $jsonSchemaValidator: IJsonSchemaValidator,
		private $projectConstants: Project.IProjectConstants,
		private $resources: IResourceLoader,
		private $logger: ILogger) { }

	public getProjectProperties(projectFile: string, isJsonProjectFile: boolean, frameworkProject: Project.IFrameworkProject): IFuture<IProjectData> {
		return ((): any => {
			var properties = isJsonProjectFile ? this.$fs.readJson(projectFile).wait() :
				this.getProjectPropertiesFromXmlProjectFile(projectFile, frameworkProject).wait();

			if (properties) {
				this.completeProjectProperties(properties, frameworkProject);
			}

			return properties;
		}).future<IProjectData>()();
	}

	public completeProjectProperties(properties: any, frameworkProject: Project.IFrameworkProject): boolean {
		var updated = false;

		if(!_.has(properties, "projectVersion")) {
			this.$logger.warn("Missing 'projectVersion' property in .abproject. Default value '1' will be used.");
			properties["projectVersion"] = 1;
			updated = true;
		}

		if(frameworkProject.completeProjectProperties(properties)) {
			updated = true;
		}

		return updated;
	}

	public updateProjectProperty(projectData: IProjectData, mode: string, property: string, newValue: any) : IFuture<void> {
		return (() => {

			var normalizedProperty = this.normalizePropertyName(property, projectData);
			var isString = this.$jsonSchemaValidator.getPropertyType(projectData.Framework, normalizedProperty) === "string";
			if(isString) {
				if (newValue.length > 1) {
					this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
				}
			}

			var propertyValue = projectData[normalizedProperty];

			if (mode === "set") {
				propertyValue = isString ? newValue[0] : newValue;
			} else if (mode === "del") {
				if(!(propertyValue instanceof Array)) {
					this.$errors.fail("Unable to remove value to non-flags property");
				}
				propertyValue = _.difference(propertyValue, newValue);
			} else if (mode === "add") {
				if(!(propertyValue instanceof Array)) {
					this.$errors.fail("Unable to add value to non-flags property");
				}
				propertyValue = _.union(propertyValue, newValue);
			} else {
				this.$errors.fail("Unknown property update mode '%s'", mode);
			}

			var projectSchema = this.$jsonSchemaValidator.tryResolveValidationSchema(projectData.Framework);

			// HACK - yargs parses double values (8.0) as integers (8)
			if(normalizedProperty === "WPSdk") {
				if(propertyValue.indexOf(".") === -1) {
					propertyValue += ".0";
				}
			}

			var propData = projectSchema[normalizedProperty];
			if(propData && propData.onChanging) {
				this.$injector.dynamicCall(propData.onChanging, [propertyValue]).wait();
			}

			projectData[normalizedProperty] = propertyValue;
			this.$jsonSchemaValidator.validate(projectData);
		}).future<void>()();
	}

	public normalizePropertyName(propertyName: string, projectData: IProjectData): string {
		var validProperties = this.getValidProperties(projectData);
		var normalizedPropertyName = validProperties[propertyName.toLowerCase()];

		if(!normalizedPropertyName) {
			var message = util.format("Unrecognized project property '%s'. Use 'appbuilder prop print' command to lists all available property names.", propertyName);
			this.$errors.fail({ formatStr: message, suppressCommandHelp: true });
		}

		return normalizedPropertyName;
	}

	public getPropertiesForAllSupportedProjects(): IFuture<string> {
		return (() => {
			var result: string[] = [];
			var schemas: IDictionary<IDictionary<any>> = Object.create(null);

			var targetFrameworkIdentifiers = _.values(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS);
			_.each(targetFrameworkIdentifiers, (targetFrameworkIdentifier: string) => {
				var projectSchema = this.$frameworkProjectResolver.resolve(targetFrameworkIdentifier).getProjectFileSchema();
				schemas[targetFrameworkIdentifier] = projectSchema;
			});

			// Get common properties
			var schemaValues = _.values(schemas);
			var firstArray = _.first(schemaValues);
			var commonPropertyNames = _.filter(_.keys(firstArray), (propertyName: string) => {
				return _.all(schemaValues, (schema: IDictionary<any>) => schema[propertyName] && schema[propertyName] === firstArray[propertyName]);
			});

			_.each(_.keys(schemas), (targetFrameworkIdentifier: string) => {
				var specificFrameworkPropertyNames = _.difference(_.keys(schemas[targetFrameworkIdentifier]), commonPropertyNames);
				var specificFrameworkProperties: IDictionary<any> = Object.create(null);
				_.each(specificFrameworkPropertyNames, (propertyName: string) => {
					specificFrameworkProperties[propertyName] = schemas[targetFrameworkIdentifier][propertyName];
				});
				var title = util.format("Project properties for %s projects:", targetFrameworkIdentifier);
				result.push(this.getProjectSchemaPartHelp(specificFrameworkProperties, title));
			});

			var commonProperties: IDictionary<string> = Object.create(null);
			_.each(commonPropertyNames, (propertyName: string) => commonProperties[propertyName] = firstArray[propertyName]);
			result.push(this.getProjectSchemaPartHelp(commonProperties, "Common properties for all projects"));

			return result.join(os.EOL + os.EOL);
		}).future<string>()();
	}

	private getValidProperties(projectData: IProjectData): any {
		return this.$jsonSchemaValidator.getValidProperties(projectData.Framework, projectData.FrameworkVersion);
	}

	private getPropRange(propData: any): IFuture<string[]>{
		return (() => {
			if (propData.dynamicRange) {
				return this.$injector.dynamicCall(propData.dynamicRange).wait();
			}
			if(propData.enum) {
				return propData.enum;
			}
			if(propData.items) {
				if(propData.items.enum) {
					return propData.items.enum;
				}
			}
			return propData.range;
		}).future<string[]>()();
	}

	public getValidValuesForProperty(propData: any): IFuture<string[]> {
		return ((): string[] => {
			var range = this.getPropRange(propData).wait();
			if(range) {
				return _.sortBy(_.values(range), (val: string) => {
					return val.toUpperCase();
				});
			}

			return null;
		}).future<string[]>()();
	}

	private getProjectSchemaPartHelp(schema: any, title: string): string {
		var help = [title];
		_.each(_.keys(schema), (propertyName: string) => {
			var value = schema[propertyName];
			help.push(util.format("  %s - %s", propertyName, value.description));
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

	private getProjectPropertiesFromXmlProjectFile(projectFile: string, frameworkProject: Project.IFrameworkProject): IFuture<any> {
		return ((): any => {
			var properties: any = {};
			var result: any = xmlMapping.tojson(this.$fs.readText(projectFile).wait());
			var propertyGroup: any = result.Project.PropertyGroup[0];

			var projectSchema = frameworkProject.getProjectFileSchema();
			_.sortBy(Object.keys(projectSchema), key => key === "FrameworkVersion" ? -1 : 1).forEach((propertyName) => {
				if (propertyGroup.hasOwnProperty(propertyName)) {
					properties[propertyName] = propertyGroup[propertyName][0];
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

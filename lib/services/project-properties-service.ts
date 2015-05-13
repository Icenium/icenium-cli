///<reference path="../.d.ts"/>
"use strict";

import os = require("os");
import xmlMapping = require("xml-mapping");
import util = require("util");
import Future = require("fibers/future");
import helpers = require("../helpers");

export class ProjectPropertiesService implements IProjectPropertiesService {
	private static PROJECT_VERSION_DEFAULT_VALUE = 1;
	
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
			let properties = isJsonProjectFile ? this.$fs.readJson(projectFile).wait() :
				this.getProjectPropertiesFromXmlProjectFile(projectFile, frameworkProject).wait();

			if (properties) {
				this.completeProjectProperties(properties, frameworkProject);
			}

			return properties;
		}).future<IProjectData>()();
	}

	public completeProjectProperties(properties: any, frameworkProject: Project.IFrameworkProject): boolean {
		let updated = false;

		if(!_.has(properties, "projectVersion")) {
			this.$logger.warn("Missing 'projectVersion' property in .abproject. Default value '1' will be used.");
			properties.projectVersion = ProjectPropertiesService.PROJECT_VERSION_DEFAULT_VALUE;
			updated = true;
		}

		if(frameworkProject.completeProjectProperties(properties)) {
			updated = true;
		}

		return updated;
	}

	public removeProjectProperty(dataToBeUpdated: IProjectData, property: string, projectData?: IProjectData) : IProjectData {
		let normalizedProperty = this.normalizePropertyName(property, projectData);
		if(dataToBeUpdated) {
			delete dataToBeUpdated[normalizedProperty];
			if(projectData) {
				this.validateProjectData(projectData, dataToBeUpdated);
			} else {
				this.validateProjectData(dataToBeUpdated);
			}
		}
		return dataToBeUpdated;
	}

	private validateProjectData(projectData: IProjectData, configurationSpecificData?: IProjectData): void {
		let dataToValidate = Object.create(null);
		_.extend(dataToValidate, projectData);
		if(configurationSpecificData) {
			_.extend(dataToValidate, configurationSpecificData);
		}
		this.$jsonSchemaValidator.validate(dataToValidate);
	}

	private notifyPropertyChanged(framework: string, propertyName: string, propertyValue: any): IFuture<void> {
		return ((): void => {
			let projectSchema = this.$jsonSchemaValidator.tryResolveValidationSchema(framework);
			let propData = projectSchema[propertyName];
			if(propData && propData.onChanging) {
				this.$injector.dynamicCall(propData.onChanging, [propertyValue]).wait();
			}
		}).future<void>()();
	}

	public updateProjectProperty(projectData: IProjectData, configurationSpecificData: IProjectData, mode: string, property: string, newValue: any) : IFuture<void> {
		return ((): void => {
			let normalizedProperty = this.normalizePropertyName(property, projectData);
			let isString = this.$jsonSchemaValidator.getPropertyType(projectData.Framework, normalizedProperty) === "string";
			if(isString) {
				if (newValue.length > 1) {
					this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
				}
			}

			let propertyValue = configurationSpecificData ? configurationSpecificData[normalizedProperty] : projectData[normalizedProperty];

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

			// HACK - yargs parses double values (8.0) as integers (8)
			if(normalizedProperty === "WPSdk") {
				if(propertyValue.indexOf(".") === -1) {
					propertyValue += ".0";
				}
			}

			this.notifyPropertyChanged(projectData.Framework, normalizedProperty, propertyValue).wait();

			if(configurationSpecificData) {
				configurationSpecificData[normalizedProperty] = propertyValue;
			} else {
				projectData[normalizedProperty] =  propertyValue;
			}

			this.validateProjectData(projectData, configurationSpecificData);
		}).future<void>()();
	}

	public normalizePropertyName(propertyName: string, projectData: IProjectData): string {
		let validProperties = this.getValidProperties(projectData);
		let normalizedPropertyName = validProperties[propertyName.toLowerCase()];

		if(!normalizedPropertyName) {
			let message = util.format("Unrecognized project property '%s'. Use 'appbuilder prop print' command to lists all available property names.", propertyName);
			this.$errors.fail({ formatStr: message, suppressCommandHelp: true });
		}

		return normalizedPropertyName;
	}

	public getPropertiesForAllSupportedProjects(): IFuture<string> {
		return (() => {
			let result: string[] = [];
			let schemas: IDictionary<IDictionary<any>> = Object.create(null);

			let targetFrameworkIdentifiers = _.values(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS);
			_.each(targetFrameworkIdentifiers, (targetFrameworkIdentifier: string) => {
				let projectSchema = this.$frameworkProjectResolver.resolve(targetFrameworkIdentifier).getProjectFileSchema();
				schemas[targetFrameworkIdentifier] = projectSchema;
			});

			// Get common properties
			let schemaValues = _.values(schemas);
			let firstArray = _.first(schemaValues);
			let commonPropertyNames = _.filter(_.keys(firstArray), (propertyName: string) => {
				return _.all(schemaValues, (schema: IDictionary<any>) => schema[propertyName] && schema[propertyName] === firstArray[propertyName]);
			});

			_.each(_.keys(schemas), (targetFrameworkIdentifier: string) => {
				let specificFrameworkPropertyNames = _.difference(_.keys(schemas[targetFrameworkIdentifier]), commonPropertyNames);
				let specificFrameworkProperties: IDictionary<any> = Object.create(null);
				_.each(specificFrameworkPropertyNames, (propertyName: string) => {
					specificFrameworkProperties[propertyName] = schemas[targetFrameworkIdentifier][propertyName];
				});
				let title = util.format("Project properties for %s projects:", targetFrameworkIdentifier);
				result.push(this.getProjectSchemaPartHelp(specificFrameworkProperties, title));
			});

			let commonProperties: IDictionary<string> = Object.create(null);
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
			let range = this.getPropRange(propData).wait();
			if(range) {
				return _.sortBy(_.values(range), (val: string) => {
					return val.toUpperCase();
				});
			}

			return null;
		}).future<string[]>()();
	}

	private getProjectSchemaPartHelp(schema: any, title: string): string {
		let help = [title];
		_.each(_.keys(schema), (propertyName: string) => {
			let value = schema[propertyName];
			help.push(util.format("  %s - %s", propertyName, value.description));
			let range = this.getPropRange(value).wait();
			if (range) {
				help.push("    Valid values:");
				_.each(range, (rangeDesc:any, rangeKey:any) => {
					let desc = "      " + (_.isArray(range) ? rangeDesc : rangeDesc.input || rangeKey);
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
			let properties: any = {};
			let result: any = xmlMapping.tojson(this.$fs.readText(projectFile).wait());
			let propertyGroup: any = result.Project.PropertyGroup[0];

			let projectSchema = frameworkProject.getProjectFileSchema();
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

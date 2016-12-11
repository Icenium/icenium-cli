import {EOL} from "os";
import xmlMapping = require("xml-mapping");
import * as util from "util";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/constants";

export class ProjectPropertiesService implements IProjectPropertiesService {
	private static PROJECT_VERSION_DEFAULT_VALUE = 1;

	constructor(private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $injector: IInjector,
		private $jsonSchemaValidator: IJsonSchemaValidator,
		private $projectConstants: Project.IConstants,
		private $resources: IResourceLoader,
		private $logger: ILogger) { }

	public getProjectProperties(projectFile: string, isJsonProjectFile: boolean, frameworkProject: Project.IFrameworkProject): IFuture<Project.IData> {
		return ((): any => {
			let properties = isJsonProjectFile ? this.$fs.readJson(projectFile).wait() :
				this.getProjectPropertiesFromXmlProjectFile(projectFile, frameworkProject);

			if (properties) {
				this.completeProjectProperties(properties, frameworkProject);
			}

			return properties;
		}).future<Project.IData>()();
	}

	public completeProjectProperties(properties: any, frameworkProject: Project.IFrameworkProject): boolean {
		let updated = false;

		if (!_.has(properties, "projectVersion")) {
			this.$logger.warn("Missing 'projectVersion' property in .abproject. Default value '1' will be used.");
			properties.projectVersion = ProjectPropertiesService.PROJECT_VERSION_DEFAULT_VALUE;
			updated = true;
		}

		if (frameworkProject.completeProjectProperties(properties)) {
			updated = true;
		}

		return updated;
	}

	public removeProjectProperty(dataToBeUpdated: Project.IData, property: string, projectData?: Project.IData): Project.IData {
		let normalizedProperty = this.normalizePropertyName(property, projectData);
		if (dataToBeUpdated) {
			delete dataToBeUpdated[normalizedProperty];
			if (projectData) {
				this.validateProjectData(projectData, dataToBeUpdated);
			} else {
				this.validateProjectData(dataToBeUpdated);
			}
		}
		return dataToBeUpdated;
	}

	public updateCorePlugins(projectData: Project.IData, configurationSpecificData: IDictionary<Project.IData>, mode: string, newValue: Array<any>, configurationsSpecifiedByUser: string[]): IFuture<void> {
		return ((): void => {
			this.moveCorePluginsToConfigurationSpecificData(projectData, configurationSpecificData);

			if (configurationsSpecifiedByUser.length === 0) {
				configurationsSpecifiedByUser = _.keys(configurationSpecificData);
			}

			_.each(configurationsSpecifiedByUser, configuration => {
				this.updateProjectProperty(projectData, configurationSpecificData[configuration], mode, this.$projectConstants.CORE_PLUGINS_PROPERTY_NAME, newValue).wait();
			});

			// check if CorePlugins in all configurations are the same
			this.tryMovingCorePluginsToProjectData(projectData, configurationSpecificData);
		}).future<void>()();
	}

	public updateProjectProperty(projectData: Project.IData, configurationSpecificData: Project.IData, mode: string, property: string, newValue: any): IFuture<void> {
		return ((): void => {
			let normalizedProperty = this.normalizePropertyName(property, projectData);
			let isString = this.$jsonSchemaValidator.getPropertyType(projectData.Framework, normalizedProperty) === "string";
			if (isString) {
				if (newValue.length > 1) {
					this.$errors.fail("Property '%s' is not a collection of flags. Specify only a single property value.", property);
				}
			}

			let propertyValue = configurationSpecificData ? configurationSpecificData[normalizedProperty] : projectData[normalizedProperty];

			if (mode === "set") {
				propertyValue = isString ? newValue[0] : newValue;
			} else if (mode === "del") {
				if (!(propertyValue instanceof Array)) {
					this.$errors.fail("Unable to remove value to non-flags property");
				}
				propertyValue = _.difference(propertyValue, newValue);
			} else if (mode === "add") {
				if (!(propertyValue instanceof Array)) {
					this.$errors.fail("Unable to add value to non-flags property");
				}
				propertyValue = _.union(propertyValue, newValue);
			} else {
				this.$errors.fail("Unknown property update mode '%s'", mode);
			}

			this.notifyPropertyChanged(projectData.Framework, normalizedProperty, propertyValue).wait();

			if (configurationSpecificData) {
				configurationSpecificData[normalizedProperty] = propertyValue;
			} else {
				projectData[normalizedProperty] = propertyValue;
			}

			this.validateProjectData(projectData, configurationSpecificData);
		}).future<void>()();
	}

	public normalizePropertyName(propertyName: string, projectData: Project.IData): string {
		let validProperties = this.getValidProperties(projectData);
		let normalizedPropertyName = validProperties[propertyName.toLowerCase()];

		if (!normalizedPropertyName) {
			let message = util.format("Unrecognized project property '%s'. Use 'appbuilder prop print' command to lists all available property names.", propertyName);
			this.$errors.fail({ formatStr: message, suppressCommandHelp: true });
		}

		return normalizedPropertyName;
	}

	public getPropertiesForAllSupportedProjects(): IFuture<string> {
		return (() => {
			let result: string[] = [];
			let schemas: IDictionary<IDictionary<any>> = Object.create(null);

			let targetFrameworkIdentifiers = _.values(TARGET_FRAMEWORK_IDENTIFIERS);
			_.each(targetFrameworkIdentifiers, (targetFrameworkIdentifier: string) => {
				let projectSchema = this.$frameworkProjectResolver.resolve(targetFrameworkIdentifier).getProjectFileSchema();
				schemas[targetFrameworkIdentifier] = projectSchema;
			});

			// Get common properties
			let schemaValues = _.values(schemas);
			let firstArray = _.first(schemaValues);
			let commonPropertyNames = _.filter(_.keys(firstArray), (propertyName: string) => {
				return _.every(schemaValues, (schema: IDictionary<any>) => schema[propertyName] && schema[propertyName] === firstArray[propertyName]);
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

			return result.join(EOL + EOL);
		}).future<string>()();
	}

	private getValidProperties(projectData: Project.IData): any {
		return this.$jsonSchemaValidator.getValidProperties(projectData.Framework, projectData.FrameworkVersion);
	}

	private getPropRange(propData: any): IFuture<string[]> {
		return (() => {
			if (propData.dynamicRange) {
				return this.$injector.dynamicCall(propData.dynamicRange).wait();
			}
			if (propData.enum) {
				return propData.enum;
			}
			if (propData.items) {
				if (propData.items.enum) {
					return propData.items.enum;
				}
			}
			return propData.range;
		}).future<string[]>()();
	}

	public getValidValuesForProperty(propData: any): IFuture<string[]> {
		return ((): string[] => {
			let range = this.getPropRange(propData).wait();
			if (range) {
				return _.sortBy(_.values<string>(range), (val: string) => {
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
				_.each(range, (rangeDesc: any, rangeKey: any) => {
					let desc = "      " + (_.isArray(range) ? rangeDesc : rangeDesc.input || rangeKey);
					if (rangeDesc.description) {
						desc += " - " + rangeDesc.description;
					}
					help.push(desc);
				});
			}
			if (value.validationMessage) {
				help.push("    " + value.validationMessage.replace(EOL, EOL + "    "));
			} else if (value.regex) {
				help.push("    Valid values match /" + value.regex.toString() + "/");
			}
		});

		return help.join(EOL);
	}

	private getProjectPropertiesFromXmlProjectFile(projectFile: string, frameworkProject: Project.IFrameworkProject): any {
		let properties: any = {};
		let result: any = xmlMapping.tojson(this.$fs.readText(projectFile));
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
	}

	private notifyPropertyChanged(framework: string, propertyName: string, propertyValue: any): IFuture<void> {
		return ((): void => {
			let projectSchema = this.$jsonSchemaValidator.tryResolveValidationSchema(framework);
			let propData = projectSchema[propertyName];
			if (propData && propData.onChanging) {
				this.$injector.dynamicCall(propData.onChanging, [propertyValue]).wait();
			}
		}).future<void>()();
	}

	private moveCorePluginsToConfigurationSpecificData(projectData: Project.IData, configurationSpecificData: IDictionary<Project.IData>): void {
		if (projectData.CorePlugins && projectData.CorePlugins.length > 0) {
			_.each(configurationSpecificData, (configurationData: Project.IData, configuration: string) => {
				this.$logger.trace(`Move CorePlugins from project data to '${configuration}' configuration.`);
				if (configurationData.CorePlugins && configurationData.CorePlugins.length > 0 && _.difference(configurationData.CorePlugins, projectData.CorePlugins).length !== 0) {
					this.$errors.failWithoutHelp(`CorePlugins are defined in both '${this.$projectConstants.PROJECT_FILE}' and '.${configuration}${this.$projectConstants.PROJECT_FILE}'. Remove them from one of the files and try again.`);
				}
				configurationData.CorePlugins = projectData.CorePlugins;
			});
		}
		delete projectData.CorePlugins;
	}

	private validateAllProjectData(projectData: Project.IData, configurationSpecificData: IDictionary<Project.IData>): void {
		let projectConfigurations = _.keys(configurationSpecificData);
		_.each(projectConfigurations, configuration => {
			this.validateProjectData(projectData, configurationSpecificData[configuration]);
		});

		this.validateProjectData(projectData);
	}

	private validateProjectData(projectData: Project.IData, configurationSpecificData?: Project.IData): void {
		let dataToValidate = Object.create(null);
		_.extend(dataToValidate, projectData);
		if (configurationSpecificData) {
			_.extend(dataToValidate, configurationSpecificData);
		}
		this.$jsonSchemaValidator.validate(dataToValidate);
	}

	private tryMovingCorePluginsToProjectData(projectData: Project.IData, configurationSpecificData: IDictionary<Project.IData>): void {
		if (this.shouldMoveCorePluginsToProjectData(configurationSpecificData)) {
			this.$logger.trace("Moving CorePlugins from configuration specific data to project data.");
			projectData.CorePlugins = _(configurationSpecificData)
				.values<Project.IData>()
				.first()
				.CorePlugins;
			_.each(configurationSpecificData, (configurationData: Project.IData, configuration: string) => {
				this.$logger.trace(`Removing property CorePlugins from '${configuration}' configuration.`);
				delete configurationData.CorePlugins;
			});

			this.validateAllProjectData(projectData, configurationSpecificData);
		}
	}

	private shouldMoveCorePluginsToProjectData(configurationSpecificData: IDictionary<Project.IData>): boolean {
		let corePluginsInConfigs = _.map(configurationSpecificData, configData => configData.CorePlugins);
		let corePluginsLenghtsInConfigs = _(corePluginsInConfigs)
			.map(c => c.length)
			.uniq()
			.value();
		let differencesBetweenPluginsInConfigs = _.difference.apply(null, corePluginsInConfigs);
		// Check if the lengths of core plugins in all configuration files are the same.
		if (corePluginsLenghtsInConfigs.length === 1 && differencesBetweenPluginsInConfigs.length === 0) {
			this.$logger.trace("No difference between CorePlugins in each configuration detected. CorePlugins should be moved to project data.");
			return true;
		}
		this.$logger.trace("There's difference between CorePlugins in configuration files. CorePlugins cannot be moved to project data.");
		return false;
	}
}
$injector.register("projectPropertiesService", ProjectPropertiesService);

///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
var jsv = require("JSV").JSV;

export class JsonSchemaValidator implements IJsonSchemaValidator {
	private static ENVIRONMENT_ID = "json-schema-draft-03";
	private static DEFAULT_SCHEMA_URI = "http://json-schema.org/draft-03/schema#";
	private static INSTANCE_IS_NOT_A_REQUIRED_TYPE_ERROR_MESSAGE = "Instance is not a required type";
	private static BUILD_SCHEMA_ID_PREFIX = "Build-";
	private static PREDEFINED_ERRORS: IStringDictionary = {
		AppIdentifier: "The application identifier must consist of at least three alphanumeric strings separated by a dot. The alphanumeric strings must start with a letter."
	}

	private environment: any = null;
	private _validPropertiesCache: IDictionary<any>;

	constructor(private $errors: IErrors,
		private $frameworkProjectResolver: Project.IFrameworkProjectResolver,
		private $fs: IFileSystem,
		private $jsonSchemaConstants: IJsonSchemaConstants,
		private $jsonSchemaLoader: IJsonSchemaLoader, // Don't delete this row, we need it
		private $jsonSchemaResolver: IJsonSchemaResolver,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $resources: IResourceLoader) {
		this.environment = jsv.createEnvironment(JsonSchemaValidator.ENVIRONMENT_ID);
		this.environment.setDefaultSchemaURI(JsonSchemaValidator.DEFAULT_SCHEMA_URI);

		this._validPropertiesCache = Object.create(null);
	}

	public getValidProperties(framework: string): IStringDictionary {
		var key = util.format("%s-%s", framework);
		if(!this._validPropertiesCache[key]) {
			this._validPropertiesCache[key] = Object.create(null);
			var schema = this.tryResolveValidationSchema(framework);
			var availableProperties = _.keys(schema);

			_.each(availableProperties, (propertyName: string) => {
				this._validPropertiesCache[key][propertyName.toLowerCase()] = propertyName;
			});
		}

		return this._validPropertiesCache[key];
	}

	public validate(data: IProjectData): void {
		var validationErrors = this.getValidationErrors(data);
		this.validateCore(data);
	}

	public validateWithBuildSchema(data: IProjectData, platformName: string): void {
		var buildSchemaName = this.getBuildSchemaName(platformName);
		this.validateCore(data, { validationSchemaName: buildSchemaName, usePredefinedErrors: false });
	}

	public isValid(data: IProjectData): boolean {
		var errors = this.getValidationErrors(data);
		return _.keys(errors).length !== 0;
	}

	public tryResolveValidationSchema(framework: string): IDictionary<any> {
		var schema = this.tryResolveValidationSchemaCore(framework);
		var result: IDictionary<any> = schema.properties;
		if(schema.extends) {
			_.each(_.keys(schema.extends.properties), (key: string) => {
				if(!result[key]) {
					result[key] = schema.extends.properties[key];
				}
			});
		}

		var projectPropertiesFilePath = this.$resources.resolvePath(util.format("project-properties-%s.json",framework.toLowerCase()));
		if(this.$fs.exists(projectPropertiesFilePath).wait()) {
			var fileContent = this.$fs.readJson(projectPropertiesFilePath).wait();
			var additionalProperties = _.keys(fileContent);
			_.each(additionalProperties, (propertyName: string) => {
				_.each(_.keys(fileContent[propertyName]), (key: string) => {
					result[propertyName][key] = fileContent[propertyName][key];
				});
			});
		}

		return result;
	}

	public getPropertyType(framework: string, propertyName: string): string {
		var schema = this.tryResolveValidationSchema(framework);
		var propertyType = schema[propertyName].type;
		return propertyType;
	}

	public validatePropertyUsingBuildSchema(propertyName: string, propertyValue: string): void {
		var invalidPlatforms: IStringDictionary = Object.create(null);
		var properties = Object.create(null);
		properties[propertyName] = propertyValue;
		_.each(this.$mobileHelper.platformNames, platformName => {
			var validationErrors = this.getBuildSchemaValidationErrors(properties, platformName);
			if(_.keys(validationErrors).length !== 0 && validationErrors[propertyName]) {
				invalidPlatforms[platformName] = validationErrors[propertyName];
			};
		});

		if(_.keys(invalidPlatforms).length === this.$mobileHelper.platformNames.length) {
			this.$errors.failWithoutHelp("The validation of provided %s property failed with following errors:\n %s", propertyName, _.values(invalidPlatforms).join("\n"));
		}

		_.each(invalidPlatforms, (error, platformName) => this.$logger.warn("The provided %s property is not valid for %s platform. %s", propertyName, platformName, error));
	}

	private getBuildSchemaValidationErrors(data: IProjectData, platformName: string): IStringDictionary {
		var buildSchemaName = this.getBuildSchemaName(platformName);
		return this.getValidationErrors(data, {validationSchemaName: buildSchemaName, usePredefinedErrors: false});
	}

	private getBuildSchemaName(platformName: string): string {
		return util.format("%s%s", JsonSchemaValidator.BUILD_SCHEMA_ID_PREFIX, platformName);
	}

	private validateCore(data: IProjectData, opts?: {validationSchemaName?: string; usePredefinedErrors?: boolean}) {
		var validationErrors = this.getValidationErrors(data, opts);
		if(_.keys(validationErrors).length !== 0) {
			var output = _.values(validationErrors).join("\n");
			this.$errors.fail("Schema validation failed with following errors: \n %s", output);
		}
	}

	private getValidationErrors(data: IProjectData, opts?: {validationSchemaName?: string; usePredefinedErrors?: boolean}): IStringDictionary {
		opts = opts || {};
		var validationSchema = this.tryResolveValidationSchemaCore(data.Framework, opts.validationSchemaName);
		var schema = this.environment.createSchema(validationSchema);
		var validationResult = this.environment.validate(data, schema);
		var errors = validationResult.errors;
		var result: IStringDictionary = Object.create(null);

		_.each(errors, (error: any) => {
			var schemaUri = error.schemaUri;
			var schemaUriParts = schemaUri.split("/");
			var propertyName = schemaUriParts[schemaUriParts.length - 1];
			if(error.message === JsonSchemaValidator.INSTANCE_IS_NOT_A_REQUIRED_TYPE_ERROR_MESSAGE) { // ugly hack :(
				error.details = util.format("Expected %s but got %s", error.details, data[propertyName]);
			}

			var errorMessage =  util.format("Property %s: %s. %s", propertyName, error.message, error.details);
			this.$logger.trace("JSV error: %s", errorMessage);

			result[propertyName] = (opts.usePredefinedErrors === false ? undefined : JsonSchemaValidator.PREDEFINED_ERRORS[propertyName]) || this.tryResolveValidationSchemaCore(undefined, opts.validationSchemaName).properties[propertyName].errorMessage || errorMessage;
		});

		return result;
	}

	private tryResolveValidationSchemaCore(framework: string, validationSchemaName?: string): ISchema {
		validationSchemaName = validationSchemaName || this.getValidationSchemaName(framework);
		var schema = this.$jsonSchemaResolver.getSchema(validationSchemaName);

		if(!schema) {
			this.$errors.fail("Unable to resolve validation schema.");
		}

		return schema;
	}

	private getValidationSchemaName(framework: string): string {
		if(!framework) {
			return this.$jsonSchemaConstants.BASE_VALIDATION_SCHEMA_ID;
		}

		var frameworkProject = this.$frameworkProjectResolver.resolve(framework);
		var validationSchemaName = frameworkProject.getValidationSchemaId();
		if(!validationSchemaName) {
			return this.$jsonSchemaConstants.BASE_VALIDATION_SCHEMA_ID;
		}

		return validationSchemaName;
	}
}
$injector.register("jsonSchemaValidator", JsonSchemaValidator);
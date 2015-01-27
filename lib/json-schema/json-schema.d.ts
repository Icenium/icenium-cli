interface ISchema {
	$schema: string;
	id: string;
	type: string;
	additionalProperties: boolean;
	properties: IDictionary<any>;
	required?: boolean;
	extends?: any
}

interface ISchemaExtends {
	"$ref": string;
	properties?: any;
}

interface IJsonSchemaLoader {
	downloadSchemas(): IFuture<void>;
}

interface IJsonSchemaResolver {
	getSchema(schemaId: string): ISchema;
}

interface IJsonSchemaValidator {
	getValidProperties(framework: string, frameworkVersion: string): IStringDictionary;
	validate(data: IProjectData): void;
	isValid(data: IProjectData): boolean;
	tryResolveValidationSchema(framework: string): IDictionary<any>;
	getPropertyType(framework: string, propertyName: string): string;
}

interface IJsonSchemaConstants {
	BASE_VALIDATION_SCHEMA_ID: string;
	BASE_CORDOVA_SCHEMA_ID: string;
	CORDOVA_VERSION_3_SCHEMA_ID: string;
	NATIVESCRIPT_SCHEMA_ID: string;
}
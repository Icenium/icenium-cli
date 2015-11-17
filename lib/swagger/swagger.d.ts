declare module Swagger {

	interface ISwaggerServiceContract {
		apis: ISwaggerApi[];
		models?: IDictionary<CodeGeneration.IModel>;
		apiVersion?: string;
		basePath?: string;
		resourcePath?: string;
		swaggerVersion?: string;
	}

	interface ISwaggerApi {
		path: string;
		operations: IOperation[];
	}

	interface IOperation {
		httpMethod: string;
		nickname: string;
		responseClass: string;
		parameters: IParameter[];
	}

	interface IParameter {
		required: boolean;
		name: string;
		paramType: string;
		dataType: string;
		allowableValues: CodeGeneration.IModelPropertyValue;
	}

	interface ITsTypeSystemHelpers {
		getReadableStreamTypeName(): string;
		getWritableStreamTypeName(): string;
		translate(typeName: string): string;
		isGeneric(typeName: string): boolean;
		isBuiltIn(typeName: string): boolean;
		isModel(modelName: string): boolean;
		isStream(typeName: string): boolean;
		addModel(modelName: string): void;
	}

	interface IServiceEndpoint {
		operationContractName: string;
		callResultType: string;
		endpointInterface: CodeGeneration.ILine;
		endpointImplementation: CodeGeneration.IBlock;
		parameters: string[];
	}
}

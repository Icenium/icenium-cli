declare module Swagger {

	interface ISwaggerServiceContract {
		apis: ISwaggerApi[];
		models?: IDictionary<IModel>;
		apiVersion?: string;
		basePath?: string;
		resourcePath?: string;
		swaggerVersion?: string;
	}

	interface IModel {
		id: string;
		properties: IDictionary<IModelProperty>;
	}

	interface IModelProperty {
		type: string;
		items: IModelPropertyItems;
		allowableValues: IModelPropertyValue;
	}

	interface IModelPropertyItems {
		$ref: string;
	}

	interface IModelPropertyValue {
		valueType: string;
		values: string[];
	}

	interface ICodeEntity {
		opener?: string;
		codeEntityType: any;
	}

	interface ILine extends ICodeEntity {
		content: string;
	}

	interface IBlock extends ICodeEntity {
		opener: string;
		codeEntities: ICodeEntity[];
		writeLine(content: string): void;
		addLine(line: ILine): void;
		addBlock(block: IBlock): void;
		addBlocks(blocks: IBlock[]): void;
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
		allowableValues: IModelPropertyValue;
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

	interface IService {
		serviceInterface: IBlock;
		serviceImplementation: IBlock;
	}

	interface IServiceEndpoint {
		operationContractName: string;
		callResultType: string;
		endpointInterface: ILine;
		endpointImplementation: IBlock;
		parameters: string[];
	}
}
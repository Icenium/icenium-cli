import { Block, Line } from "../common/codeGeneration/code-entity";
import { TSTypeSystemHelpers } from "./ts-type-system-helpers";
import { CodePrinter } from "../common/codeGeneration/code-printer";

enum ParamTypes {
	Path,
	Query,
	Body,
	Form
}

export class ServiceContractGenerator implements IServiceContractGenerator {
	private tsTypeSystemHelpers: Swagger.ITsTypeSystemHelpers;
	private pendingModels: any;

	constructor(private $serviceContractProvider: Server.IServiceContractProvider) {
		this.tsTypeSystemHelpers = new TSTypeSystemHelpers();
		this.pendingModels = {};
	}

	public async generate(): Promise<IServiceContractClientCode> {
		let swagger = await this.$serviceContractProvider.getApi();
		let interfacesFile = new Block();
		let implementationsFile = new Block();

		implementationsFile.writeLine("// automatically generated code; do not edit manually!");
		implementationsFile.writeLine("//");
		implementationsFile.writeLine("\"use strict\";");
		implementationsFile.writeLine("");
		implementationsFile.writeLine("import querystring = require('querystring');");
		implementationsFile.writeLine("");

		interfacesFile.writeLine("//");
		interfacesFile.writeLine("// automatically generated code; do not edit manually!");
		interfacesFile.writeLine("//");
		let serverModuleName = "Server";
		let serverModuleDeclaration = new Block("declare module " + serverModuleName);
		serverModuleDeclaration.toString();

		let serverClass = new Block("export class ServiceContainer implements Server.IServer");
		let serverInterface = new Block("interface IServer");

		serverClass.writeLine("constructor(private $injector: IInjector) { }");

		for (let i = 0; i < swagger.apis.length; ++i) {
			const apiPath = swagger.apis[i];
			let swaggerService = await this.$serviceContractProvider.getApi(apiPath.path);

			let models: CodeGeneration.IBlock[] = this.generateModels(swaggerService.models);
			serverModuleDeclaration.addBlocks(models);

			let service = this.generateService(swaggerService, serverModuleName);

			_.each(_.keys(this.pendingModels), (modelName: string) => {
				let model = this.pendingModels[modelName];
				let modelBlockAdded = _.some(serverModuleDeclaration.codeEntities, ce => ce.opener === model.opener);
				if (model && !modelBlockAdded) {
					serverModuleDeclaration.addBlock(model);
				}
			});

			serverModuleDeclaration.addBlock(service.serviceInterface);
			implementationsFile.addBlock(service.serviceImplementation);

			let serviceName = swaggerService.resourcePath.substr(1);

			let name = this.getNameWithoutSlash(serviceName);
			serverInterface.writeLine(`${name}: Server.I${this.toPascalCase(name)}ServiceContract;`);
			serverClass.writeLine(`public ${name}: Server.I${this.toPascalCase(name)}ServiceContract = this.$injector.resolve(${this.toPascalCase(name)}Service);`);
		};

		serverModuleDeclaration.addBlock(serverInterface);
		interfacesFile.addBlock(serverModuleDeclaration);

		implementationsFile.addBlock(serverClass);
		implementationsFile.writeLine("$injector.register('server', ServiceContainer);");

		let codePrinter = new CodePrinter();
		return {
			interfaceFile: codePrinter.composeBlock(interfacesFile),
			implementationFile: codePrinter.composeBlock(implementationsFile)
		};
	}

	private generateModels(models: IDictionary<CodeGeneration.IModel>): CodeGeneration.IBlock[] {
		let modelsBlocks: CodeGeneration.IBlock[] = [];
		_.each(models, (model: CodeGeneration.IModel) => {
			if (model.id.indexOf("`") < 0) {
				let typeName = this.tsTypeSystemHelpers.translate(model.id);
				if (!this.tsTypeSystemHelpers.isModel(typeName)) {
					this.visitModel(model);
					if (this.tsTypeSystemHelpers.isModel(typeName)) {
						modelsBlocks.push(this.generateModel(model));
					}
				}
			}
		});

		return modelsBlocks;
	}

	private getNameWithoutSlash(name: string) {
		let result = name;
		let index: number;
		do {
			index = result.indexOf("/");
			if (~index) {
				result = result.substring(0, index) + result[index + 1].toUpperCase() + result.substr(index + 2);
			}
		} while (~index);

		return result;
	}

	private generateModel(model: CodeGeneration.IModel): CodeGeneration.IBlock {
		let name = this.getNameWithoutSlash(model.id);
		let modelBlock: CodeGeneration.IBlock = new Block(`interface ${name}`);
		let properties = _.keys(model.properties);
		_.each(properties, (propertyName: string) => {
			let typeName = this.getModelPropertyTypeName(model.properties[propertyName]);
			if (!this.tsTypeSystemHelpers.isBuiltIn(typeName)) {
				typeName = `Server.${typeName}`;
			}
			modelBlock.writeLine(`${propertyName.replace(" ", "")}: ${typeName};`);
		});

		return modelBlock;
	}

	private visitModel(model: CodeGeneration.IModel): void {
		if (!this.tsTypeSystemHelpers.isGeneric(model.id)) {
			let modelName = this.tsTypeSystemHelpers.translate(model.id);
			this.tsTypeSystemHelpers.addModel(modelName);
		}

		_.each(model.properties, (property: CodeGeneration.IModelProperty) => this.visitModelProperty(property));
	}

	private visitModelProperty(property: CodeGeneration.IModelProperty) {
		if (property.allowableValues) {
			this.tsTypeSystemHelpers.addModel(property.allowableValues.valueType);
			this.ensureEnumAdded(property.allowableValues);
		}
	}

	private getModelPropertyTypeName(property: CodeGeneration.IModelProperty): string {
		let typeName: string;
		if (property.items) {
			typeName = property.items.$ref + "[]";
		} else {
			typeName = this.tsTypeSystemHelpers.translate(property.type);
		}
		return typeName;
	}

	private ensureEnumAdded(allowableValues: CodeGeneration.IModelPropertyValue) {
		let typeName = this.tsTypeSystemHelpers.translate(allowableValues.valueType);
		if (!this.pendingModels[typeName]) {
			let enumBlock = new Block(`const enum ${typeName}`);
			_.each(allowableValues.values, (value: string) => enumBlock.writeLine(`${value},`));
			this.pendingModels[typeName] = enumBlock;
		}
	}

	private generateService(swaggerService: Swagger.ISwaggerServiceContract, serverModuleName: string): CodeGeneration.IService {
		let swaggerServiceContractName = this.getSwaggerServiceContractName(swaggerService);
		let serviceInterface = new Block(`interface ${swaggerServiceContractName}`);

		let serviceImplementation = new Block(`export class ${this.getSwaggerServiceName(swaggerService)} implements ${serverModuleName}.${swaggerServiceContractName}`);
		serviceImplementation.addBlock(new Block(`constructor(private $serviceProxy: ${serverModuleName}.IServiceProxy)`));

		let map: IDictionary<Swagger.IServiceEndpoint[]> = Object.create(null);

		_.each(swaggerService.apis, (api: Swagger.ISwaggerApi) => {
			_.each(api.operations, (operation: Swagger.IOperation) => {
				if (!this.hasFormParamType(operation)) {
					if (!map[operation.nickname]) {
						map[operation.nickname] = [];
					}
					let generatedOperation = this.generateOperation(operation, swaggerService.basePath, api.path);
					map[operation.nickname].push(generatedOperation);
				}
			});
		});

		let values = _.values(map);

		_.each(values, (endpoints: Swagger.IServiceEndpoint[]) => {
			let index = 0;
			_.each(endpoints, (endpoint: Swagger.IServiceEndpoint) => {
				if (index === 0) {

					serviceInterface.addLine(endpoint.endpointInterface);

					serviceImplementation.addBlock(endpoint.endpointImplementation);
				} else {
					let implementationOpener = `public ${endpoint.operationContractName + index}(${endpoint.parameters.join(", ")}): Promise<${endpoint.callResultType}>`;
					let interfaceOpener = `${endpoint.operationContractName + index}(${endpoint.parameters.join(", ")}): Promise<${endpoint.callResultType}>;`;

					let implementationBlock = new Block(implementationOpener);
					implementationBlock.writeLine(_.map(endpoint.endpointImplementation.codeEntities, (codeEntity: CodeGeneration.ILine) => codeEntity.content).join("\n"));

					serviceInterface.addLine(Line.create(interfaceOpener));
					serviceImplementation.addBlock(implementationBlock);
				}
				index++;
			});
		});

		return { serviceInterface: serviceInterface, serviceImplementation: serviceImplementation };
	}

	private getSwaggerServiceContractName(swaggerService: Swagger.ISwaggerServiceContract): string {
		let swaggerServiceName = this.getSwaggerServiceClassName(swaggerService);
		let name = this.getNameWithoutSlash(swaggerServiceName);
		return `I${name}ServiceContract`;
	}

	private getSwaggerServiceName(swaggerService: Swagger.ISwaggerServiceContract): string {
		let swaggerServiceName = this.getSwaggerServiceClassName(swaggerService);
		let name = this.getNameWithoutSlash(swaggerServiceName);
		return `${name}Service`;
	}

	private getSwaggerServiceClassName(swaggerService: Swagger.ISwaggerServiceContract): string {
		let swaggerServiceName = swaggerService.resourcePath.substr(1);
		return this.toPascalCase(swaggerServiceName);
	}

	private toPascalCase(name: string) {
		return name[0].toUpperCase() + name.substr(1);
	}

	private toCamelCase(name: string) {
		return name[0].toLowerCase() + name.substr(1);
	}

	private quote(s: string): string {
		return "'" + s + "'";
	}

	private escapeKeyword(name: string): string {
		if (name === "package") {
			return name + "_";
		}
		return name;
	}

	private compare(a: number, b: number): number {
		if (a < b) {
			return -1;
		} else if (a > b) {
			return 1;
		}
		return 0;
	}

	private hasFormParamType(operation: Swagger.IOperation): boolean {
		return !!_.find(operation.parameters, (parameter) => this.isParameterOfType(parameter, ParamTypes.Form));
	}

	private generateOperation(operation: Swagger.IOperation, basePath: string, path: string): Swagger.IServiceEndpoint {
		let operationContractName = this.getOperationContractName(operation);
		let parameters: string[] = [];

		let enumPathParameters: IStringDictionary = {};
		operation.parameters.sort((parameter: Swagger.IParameter, otherParameter: Swagger.IParameter) => {
			let parameterType = this.getParameterType(parameter);
			let otherParameterType = this.getParameterType(otherParameter);

			if (parameterType < otherParameterType) {
				return -1;
			} else if (parameterType > otherParameterType) {
				return 1;
			} else if (parameterType === ParamTypes.Path) {
				return this.compare(path.indexOf(parameter.name), path.indexOf(otherParameter.name));
			} else {
				return parameter.name.localeCompare(otherParameter.name);
			}
		});

		let pathParams = this.getSwaggerParamsByType(operation, ParamTypes.Path);
		_.each(pathParams, (parameter: Swagger.IParameter) => {
			if (parameter.allowableValues !== undefined && parameter.dataType === "string") {
				this.tsTypeSystemHelpers.addModel(parameter.allowableValues.valueType);
				this.ensureEnumAdded(parameter.allowableValues);
				enumPathParameters[parameter.name] = "<any>";
			}
		});

		let paramsMap: IDictionary<string> = Object.create(null);

		_.each(operation.parameters, (parameter: Swagger.IParameter) => {
			let tsTypeName = this.tsTypeSystemHelpers.translate(parameter.dataType);
			if (this.tsTypeSystemHelpers.isStream(tsTypeName)) {
				tsTypeName = this.tsTypeSystemHelpers.getReadableStreamTypeName();
			} else if (parameter.allowableValues) {
				this.tsTypeSystemHelpers.addModel(parameter.allowableValues.valueType);
				this.ensureEnumAdded(parameter.allowableValues);
				tsTypeName = this.tsTypeSystemHelpers.translate(parameter.allowableValues.valueType);
			}

			if (!this.tsTypeSystemHelpers.isBuiltIn(tsTypeName)) {
				tsTypeName = "Server." + tsTypeName;
			}

			parameter.name = this.escapeKeyword(parameter.name);
			parameters.push(`${parameter.name}: ${tsTypeName}`);

			paramsMap[parameter.name] = tsTypeName;
		});

		let numberOfClosingBrackets = 0;
		let responseType = this.tsTypeSystemHelpers.translate(operation.responseClass)
			.split(/[<>]/)
			.filter(e => e)
			.map(rt => this.tsTypeSystemHelpers.isBuiltIn(rt) ? rt : `Server.${rt}`)
			.reduce((prev, current) => { ++numberOfClosingBrackets; return `${prev}<${current}` }) + _.repeat(">", numberOfClosingBrackets);

		let httpCallParameters = [this.quote(operation.nickname), this.quote(operation.httpMethod)];

		let httpCallPath = this.generateHttpCallPath(operation, basePath, path, enumPathParameters);
		httpCallParameters.push(httpCallPath);

		let accepts = this.getAccepts(operation);
		httpCallParameters.push(accepts ? this.quote(accepts) : "null");

		let bodyParams = this.generateBodyParams(operation);
		httpCallParameters.push(bodyParams);

		if (this.tsTypeSystemHelpers.isStream(responseType)) {
			parameters.push("$resultStream: " + this.tsTypeSystemHelpers.getWritableStreamTypeName());
			httpCallParameters.push("$resultStream");
		} else {
			httpCallParameters.push("null");
		}

		let callResultType = this.tsTypeSystemHelpers.isStream(responseType) ? "void" : responseType;
		let generatedContract = Line.create(`${operationContractName}(${parameters.join(", ")}): Promise<${callResultType}>;`);
		let generatedOperation = new Block(`public ${operationContractName}(${parameters.join(", ")}): Promise<${callResultType}>`);
		generatedOperation.writeLine(`return this.$serviceProxy.call<${callResultType}>(${httpCallParameters.join(", ")});`);

		return {
			operationContractName: operationContractName,
			endpointInterface: generatedContract,
			endpointImplementation: generatedOperation,
			parameters: parameters,
			callResultType: callResultType
		};
	}

	private getOperationContractName(operation: Swagger.IOperation): string {
		return this.toCamelCase(operation.nickname);
	}

	private getSwaggerParamsByType(operation: Swagger.IOperation, paramType: ParamTypes): Swagger.IParameter[] {
		return _.filter(operation.parameters, (parameter: Swagger.IParameter) => {
			return this.isParameterOfType(parameter, paramType);
		});
	}

	private isParameterOfType(parameter: Swagger.IParameter, paramType: ParamTypes) {
		switch (paramType) {
			case ParamTypes.Path:
				return parameter.paramType === "path";
			case ParamTypes.Query:
				return parameter.paramType === "query";
			case ParamTypes.Body:
				return parameter.paramType === "body";
			case ParamTypes.Form:
				return parameter.paramType === "form";
			default:
				return false;
		}
	}

	private getParameterType(parameter: Swagger.IParameter): ParamTypes {
		if (this.isParameterOfType(parameter, ParamTypes.Path)) {
			return ParamTypes.Path;
		} else if (this.isParameterOfType(parameter, ParamTypes.Query)) {
			return ParamTypes.Query;
		} else if (this.isParameterOfType(parameter, ParamTypes.Body)) {
			return ParamTypes.Body;
		} else if (this.isParameterOfType(parameter, ParamTypes.Form)) {
			return ParamTypes.Form;
		}
		return null;
	}

	private generateHttpCallPath(operation: Swagger.IOperation, basePath: string, path: string, enumPathParameters: any): string {
		let components = _.filter(path.split("/"), (component) => !!component && !!component.trim());
		let pathComponents = _.map(components, (pathComponent: string) => {
			let matchParam = /{(.+)}/.exec(pathComponent);
			if (matchParam) {
				let param = matchParam[1];
				if (enumPathParameters[param]) {
					param = "(" + enumPathParameters[param] + param + ")";
				}
				return `encodeURI(${param}.replace(/${"\\\\"}/g, '/'))`;
			}
			return this.quote(pathComponent);
		});

		let fullPath: string[] = [];
		_.each(basePath.split("/"), (part) => {
			if (part) {
				fullPath.push(this.quote(part));
			}
		});
		fullPath = fullPath.concat(pathComponents);

		let callPath = `[${fullPath.join(", ")}].join('/')`;

		let queryParams = this.getSwaggerParamsByType(operation, ParamTypes.Query);
		if (queryParams.length > 0) {
			let queryParamMap = _.map(queryParams, (param) => `'${param.name}': ${param.name}`).join(", ");
			callPath += ` + '?' + querystring.stringify({ ${queryParamMap} })`;
		}
		return callPath;
	}

	private getAccepts(operation: Swagger.IOperation): string {
		if (this.tsTypeSystemHelpers.isStream(operation.responseClass)) {
			return "application/octet-stream";
		} else if (this.tsTypeSystemHelpers.translate(operation.responseClass) === "void") {
			return null;
		}
		return "application/json";
	}

	private generateBodyParams(operation: Swagger.IOperation): string {
		let bodyParams = this.getSwaggerParamsByType(operation, ParamTypes.Body);
		let result: string[] = [];
		_.each(bodyParams, (bodyParam: Swagger.IParameter) => {
			let contentType = this.getContentType(bodyParam.dataType);
			let paramValue = bodyParam.name;
			if (contentType === "application/json") {
				paramValue = `JSON.stringify(${bodyParam.name})`;
			}

			result.push(`{ name: ${this.quote(bodyParam.name)}, value: ${paramValue}, contentType: ${this.quote(contentType)} }`);
		});

		if (result.length === 0) {
			return "null";
		}
		return "[" + result.toString() + "]";
	}

	private getContentType(typeName: string): string {
		if (this.tsTypeSystemHelpers.isStream(typeName)) {
			return "application/octet-stream";
		}
		return "application/json";
	}
}
$injector.register("serviceContractGenerator", ServiceContractGenerator);

///<reference path="../.d.ts"/>
"use strict";
import util = require("util");

import codeEntityLib = require("./code-entity");
import TSTypeSystemHelpersLib = require("./ts-type-system-helpers");
import swaggerCodePrinterLib = require("./code-printer");

enum ParamTypes {
	Path,
	Query,
	Body,
	Form
}

export class ServiceContractGenerator implements Server.IServiceContractGenerator {
	private tsTypeSystemHelpers: Swagger.ITsTypeSystemHelpers;
	private pendingModels: any;

	constructor(private $serviceContractProvider: Server.IServiceContractProvider) {
		this.tsTypeSystemHelpers = new TSTypeSystemHelpersLib.TSTypeSystemHelpers();
	}

	public generate(): IFuture<Server.IServiceContractClientCode> {
		return ((): Server.IServiceContractClientCode => {
			var swagger = this.$serviceContractProvider.getApi().wait();
			var interfacesFile= new codeEntityLib.Block();
			var implementationsFile = new codeEntityLib.Block();

			implementationsFile.writeLine("///<reference path=\".d.ts\"/>");
			implementationsFile.writeLine("//");
			implementationsFile.writeLine("// automatically generated code; do not edit manually!");
			implementationsFile.writeLine("//");
			implementationsFile.writeLine("\"use strict\";");
			implementationsFile.writeLine("");
			implementationsFile.writeLine("import querystring = require('querystring');");
			implementationsFile.writeLine("import helpers = require('./helpers');");
			implementationsFile.writeLine("");

			interfacesFile.writeLine("//");
			interfacesFile.writeLine("// automatically generated code; do not edit manually!");
			interfacesFile.writeLine("//");
			interfacesFile.writeLine("///<reference path=\".d.ts\"/>");

			var serverModuleName = "Server";
			var serverModuleDeclaration = new codeEntityLib.Block("declare module " + serverModuleName);
			serverModuleDeclaration.toString();

			var serverClass = new codeEntityLib.Block("export class ServiceContainer implements Server.IServer");
			var serverInterface = new codeEntityLib.Block("interface IServer");

			_.each(swagger.apis, (apiPath: Swagger.ISwaggerApi) => {
				this.pendingModels = {};
				var swaggerService = this.$serviceContractProvider.getApi(apiPath.path).wait();

				var models: Swagger.IBlock[] = this.generateModels(swaggerService.models);
				serverModuleDeclaration.addBlocks(models);

				var service = this.generateService(swaggerService, serverModuleName);

				_.each(_.keys(this.pendingModels), (modelName: string) => {
					var model = this.pendingModels[modelName];
					if(model) {
						serverModuleDeclaration.addBlock(model);
					}
				});

				serverModuleDeclaration.addBlock(service.serviceInterface);
				implementationsFile.addBlock(service.serviceImplementation);

				var serviceName = swaggerService.resourcePath.substr(1);

				serverInterface.writeLine(util.format( "%s: Server.I%sServiceContract;", serviceName, this.toPascalCase(serviceName)));
				serverClass.writeLine(util.format("public %s: Server.I%sServiceContract = $injector.resolve(%sService);",
					serviceName, this.toPascalCase(serviceName), this.toPascalCase(serviceName)));
			});

			serverModuleDeclaration.addBlock(serverInterface);
			interfacesFile.addBlock(serverModuleDeclaration);

			implementationsFile.addBlock(serverClass);
			implementationsFile.writeLine("$injector.register('server', ServiceContainer);");

			var codePrinter = new swaggerCodePrinterLib.SwaggerCodePrinter();
			return {
				interfaceFile: codePrinter.composeBlock(interfacesFile),
				implementationFile: codePrinter.composeBlock(implementationsFile)
			};

		}).future<Server.IServiceContractClientCode>()();
	}

	private generateModels(models: IDictionary<Swagger.IModel>): Swagger.IBlock[] {
		var modelsBlocks: Swagger.IBlock[] = [];
		_.each(models, (model: Swagger.IModel) => {
			if(model.id.indexOf("`") < 0) {
				var typeName = this.tsTypeSystemHelpers.translate(model.id);
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

	private generateModel(model: Swagger.IModel): Swagger.IBlock {
		var modelBlock: Swagger.IBlock = new codeEntityLib.Block(util.format("interface %s", model.id));
		var properties = _.keys(model.properties);
		_.each(properties, (propertyName: string) => {
			var typeName = this.getModelPropertyTypeName(model.properties[propertyName]);
			if(!this.tsTypeSystemHelpers.isBuiltIn(typeName)) {
				typeName = util.format("Server.%s", typeName);
			}
			modelBlock.writeLine(util.format("%s: %s;", propertyName, typeName));
		});

		return modelBlock;
	}

	private visitModel(model: Swagger.IModel): void {
		if (!this.tsTypeSystemHelpers.isGeneric(model.id)) {
			var modelName = this.tsTypeSystemHelpers.translate(model.id);
			this.tsTypeSystemHelpers.addModel(modelName);
		}

		_.each(model.properties, (property: Swagger.IModelProperty) => this.visitModelProperty(property));
	}

	private visitModelProperty(property: Swagger.IModelProperty) {
		if (property.allowableValues) {
			this.tsTypeSystemHelpers.addModel(property.allowableValues.valueType);
			this.ensureEnumAdded(property.allowableValues);
		}
	}

	private getModelPropertyTypeName(property: Swagger.IModelProperty): string {
		var typeName: string;
		if (property.items) {
			typeName = property.items.$ref + "[]";
		} else {
			typeName = this.tsTypeSystemHelpers.translate(property.type);
		}
		return typeName;
	}

	private ensureEnumAdded(allowableValues: Swagger.IModelPropertyValue) {
		var typeName = this.tsTypeSystemHelpers.translate(allowableValues.valueType);
		if (!this.pendingModels[typeName]) {
			var enumBlock = new codeEntityLib.Block(util.format("enum %s", typeName));
			_.each(allowableValues.values, (value: string) => enumBlock.writeLine(util.format("%s,", value)));
		}
		this.pendingModels[typeName] = enumBlock;
	}


	private generateService(swaggerService: Swagger.ISwaggerServiceContract, serverModuleName: string): Swagger.IService {
		var swaggerServiceContractName = this.getSwaggerServiceContractName(swaggerService);
		var serviceInterface = new codeEntityLib.Block(util.format("interface %s", swaggerServiceContractName));
		var serviceImplementation = new codeEntityLib.Block(util.format("export class %s implements %s.%s", this.getSwaggerServiceName(swaggerService), serverModuleName, swaggerServiceContractName));
		serviceImplementation.addBlock(new codeEntityLib.Block(util.format("constructor(private $serviceProxy: %s.IServiceProxy)", serverModuleName)));
		_.each(swaggerService.apis, (api: Swagger.ISwaggerApi) => {
			_.each(api.operations, (operation: Swagger.IOperation) => {
				if (!this.hasFormParamType(operation)) {
					var generatedOperation: Swagger.IServiceEndpoint = this.generateOperation(operation, swaggerService.basePath, api.path);
					serviceInterface.addLine(generatedOperation.endpointInterface);
					serviceImplementation.addBlock(generatedOperation.endpointImplementation);
				}
			});
		});

		return {serviceInterface: serviceInterface, serviceImplementation: serviceImplementation};
	}

	private getSwaggerServiceContractName(swaggerService: Swagger.ISwaggerServiceContract): string {
		var swaggerServiceName = this.getSwaggerServiceClassName(swaggerService);
		return util.format("I%sServiceContract", swaggerServiceName);
	}

	private getSwaggerServiceName(swaggerService: Swagger.ISwaggerServiceContract): string {
		var swaggerServiceName = this.getSwaggerServiceClassName(swaggerService);
		return util.format("%sService", swaggerServiceName);
	}

	private getSwaggerServiceClassName(swaggerService: Swagger.ISwaggerServiceContract): string {
		var swaggerServiceName = swaggerService.resourcePath.substr(1);
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
			return "$" + name;
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
		var operationContractName = this.getOperationContractName(operation);
		var parameters: string[] = [];

		var enumPathParameters = {};
		operation.parameters.sort((parameter: Swagger.IParameter, otherParameter: Swagger.IParameter) => {
			var parameterType = this.getParameterType(parameter);
			var otherParameterType = this.getParameterType(otherParameter);

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

		var pathParams = this.getSwaggerParamsByType(operation, ParamTypes.Path);
		_.each(pathParams, (parameter: Swagger.IParameter) => {
			if (parameter.allowableValues !== undefined && parameter.dataType === "string") {
				this.tsTypeSystemHelpers.addModel(parameter.allowableValues.valueType);
				this.ensureEnumAdded(parameter.allowableValues);
				enumPathParameters[parameter.name] = "Server." + this.tsTypeSystemHelpers.translate(parameter.allowableValues.valueType);
			}
		});

		_.each(operation.parameters, (parameter: Swagger.IParameter) => {
			var tsTypeName = this.tsTypeSystemHelpers.translate(parameter.dataType);
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
			parameters.push(util.format("%s: %s", parameter.name, tsTypeName));
		});

		var responseType = this.tsTypeSystemHelpers.translate(operation.responseClass);
		if (!this.tsTypeSystemHelpers.isBuiltIn(responseType)) {
			responseType = "Server." + responseType;
		}

		var httpCallParameters = [this.quote(operation.nickname), this.quote(operation.httpMethod)];
		httpCallParameters.push(this.generateHttpCallPath(operation, basePath, path, enumPathParameters));
		httpCallParameters.push(this.quote(this.getAccepts(operation)));
		httpCallParameters.push(this.generateBodyParams(operation));

		if (this.tsTypeSystemHelpers.isStream(responseType)) {
			parameters.push("$resultStream: " + this.tsTypeSystemHelpers.getWritableStreamTypeName());
			httpCallParameters.push("$resultStream");
		} else {
			httpCallParameters.push("null");
		}

		var callResultType = this.tsTypeSystemHelpers.isStream(responseType) ? "void" : responseType;
		var generatedContract = codeEntityLib.Line.create(util.format("%s(%s): IFuture<%s>;", operationContractName, parameters.join(", "), callResultType));
		var generatedOperation = new codeEntityLib.Block(util.format("public %s(%s): IFuture<%s>", operationContractName, parameters.join(", "), callResultType));
		generatedOperation.writeLine(util.format("return this.$serviceProxy.call<%s>(%s);", callResultType, httpCallParameters.join(", ")));

		return {endpointInterface: generatedContract, endpointImplementation: generatedOperation};
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
		switch(paramType) {
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
		var components = _.filter(path.split("/"), (component) => !!component && !!component.trim());
		var pathComponents = _.map(components, (pathComponent: string) => {
			var matchParam = /{(.+)}/.exec(pathComponent);
			if (matchParam) {
				var param = matchParam[1];
				if (enumPathParameters[param]) {
					param = enumPathParameters[param] + "[" + param + "]";
				}
				return util.format("encodeURI(helpers.stringReplaceAll(%s,'\\\\', '/'))", param);
			}
			return this.quote(pathComponent);
		});

		var fullPath: string[] = [];
		_.each(basePath.split("/"), (part) => {
			if (part) {
				fullPath.push(this.quote(part));
			}
		});
		fullPath = fullPath.concat(pathComponents);

		var path = util.format("[%s].join('/')", fullPath.toString());

		var queryParams = this.getSwaggerParamsByType(operation, ParamTypes.Query);
		if (queryParams.length > 0) {
			path += util.format(" + '?' + querystring.stringify({ %s })",
				_.map(queryParams, (param) => util.format("'%s': %s", param.name, param.name)).join(", "));
		}
		return path;
	}

	private getAccepts(operation: Swagger.IOperation): string {
		if (this.tsTypeSystemHelpers.isStream(operation.responseClass)) {
			return "application/octet-stream";
		}
		return "application/json";
	}

	private generateBodyParams(operation: Swagger.IOperation): string {
		var bodyParams = this.getSwaggerParamsByType(operation, ParamTypes.Body);
		var result: string[] = [];
		_.each(bodyParams, (bodyParam: Swagger.IParameter) => {
			result.push(util.format("{name: %s, value: %s, contentType: %s}",
				this.quote(bodyParam.name), bodyParam.name, this.quote(this.getContentType(bodyParam.dataType))));
		});

		if (result.length == 0) {
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
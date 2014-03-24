///<reference path=".d.ts"/>

"use strict";

import util = require("util");
import Future = require("fibers/future");
import cookielib = require("cookie");
import Url = require("url");
import helpers = require("./helpers");
import zlib = require("zlib");
var querystring = require("querystring");
import os = require("os");

export class HttpClient implements Server.IHttpClient {
	private defaultUserAgent: string;

	constructor(private $logger: ILogger,
		private $config: IConfiguration) {}

	httpRequest(options): IFuture<Server.IResponse> {
		return (() => {
			if (_.isString(options)) {
				options = {
					url: options,
					method: "GET"
				}
			}

			var unmodifiedOptions = _.clone(options);

			if (options.url) {
				var urlParts = Url.parse(options.url);
				if (urlParts.protocol) {
					options.proto = urlParts.protocol.slice(0, -1);
				}
				options.host = urlParts.hostname;
				options.port = urlParts.port;
				options.path = urlParts.path;
				delete options.url;
			}

			var requestProto = options.proto || "http";
			delete options.proto;
			var body = options.body;
			delete options.body;
			var pipeTo = options.pipeTo;
			delete options.pipeTo;

			var proto = this.$config.PROXY_TO_FIDDLER ? "http" : requestProto;
			var http = require(proto);

			options.headers = options.headers || {};
			var headers = options.headers;

			if (this.$config.PROXY_TO_FIDDLER) {
				options.path = requestProto + "://" + options.host + options.path;
				headers.Host = options.host;
				options.host = "127.0.0.1";
				options.port = 8888;
			}

			if (!headers.Accept || headers.Accept.indexOf("application/json") < 0) {
				if (headers.Accept) {
					headers.Accept += ", ";
				} else {
					headers.Accept = "";
				}
				headers.Accept += "application/json; charset=UTF-8, */*;q=0.8";
			}

			if (!headers["User-Agent"]) {
				if (!this.defaultUserAgent) {
					this.defaultUserAgent = util.format("AppBuilderCLI/%s (Node.js %s; %s; %s)",
						this.$config.version,
						process.versions.node, process.platform, process.arch);
					this.$logger.debug("User-Agent: %s", this.defaultUserAgent);
				}

				headers["User-Agent"] = this.defaultUserAgent;
			}

			if (!headers["Accept-Encoding"]) {
				headers["Accept-Encoding"] = "gzip,deflate";
			}

			var result = new Future<Server.IResponse>();

			this.$logger.trace("httpRequest: %s", util.inspect(options));

			var request = http.request(options, (response) => {
				var data = [];
				var isRedirect = helpers.isResponseRedirect(response);
				var successful = helpers.isRequestSuccessful(response);
				if (!successful) {
					pipeTo = undefined;
				}

				var responseStream = response;
				switch (response.headers['content-encoding']) {
					case 'gzip':
						responseStream = responseStream.pipe(zlib.createGunzip());
						break;
					case 'deflate':
						responseStream = responseStream.pipe(zlib.createInflate());
						break;
				}

				if (pipeTo) {
					pipeTo.on("finish", () => {
						this.$logger.trace("httpRequest: Piping done. code = %d", response.statusCode);
						result.return({
							response: response,
							headers: response.headers
						});
					});
					responseStream.pipe(pipeTo);
				} else {
					responseStream.on("data", (chunk) => {
						this.$logger.trace("httpRequest: Receiving data:\n" + chunk);
						data.push(chunk);
					});

					responseStream.on("end", () => {
						this.$logger.trace("httpRequest: Done. code = %d", response.statusCode);
						var body = data.join("");

						if (successful || isRedirect) {
							result.return({
								body: body,
								response: response,
								headers: response.headers,
							})
					} else {
							var errorMessage = this.getErrorMessage(response, body);
							var theError: any = new Error(errorMessage);
							theError.response = response;
							theError.body = body;
							result.throw(theError);
						}
					});
				}
			});

			this.$logger.trace("httpRequest: Sending:\n%s", body);

			if (!body || !body.pipe) {
				request.end(body);
			} else {
				body.pipe(request);
			}

			var response = result.wait();
			if(helpers.isResponseRedirect(response.response)) {
				if (response.response.statusCode == 303) {
					unmodifiedOptions.method = "GET";
				}

				this.$logger.trace("Begin redirected to %s", response.headers.location);
				unmodifiedOptions.url = response.headers.location;
				return this.httpRequest(unmodifiedOptions).wait();
			}

			return response;
		}).future<Server.IResponse>()();
	}

	private getErrorMessage(response, body: string): string {
		if (response.statusCode === 402) {
			var subscriptionUrl = util.format("%s://%s/account/subscription", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
			return util.format("Your subscription has expired. Go to %s to manage your subscription. Note: After you renew your subscription, " +
				"log out and log back in for the changes to take effect.", subscriptionUrl);
		} else {
			try {
				var err = JSON.parse(body);

				if (_.isString(err)) {
					return err;
				}

				if (err.ExceptionMessage) {
					return err.ExceptionMessage;
				}
				if (err.Message) {
					return err.Message;
				}
			} catch (parsingFailed) {}

			return body;
		}
	}
}
$injector.register("httpClient", HttpClient);

export class ServiceProxy implements Server.IServiceProxy {
	private lastCallCookies: any;
	private shouldAuthenticate: boolean = true;
	private solutionSpaceName: string;

	constructor(private $httpClient: Server.IHttpClient,
		private $userDataStore: IUserDataStore,
		private $logger: ILogger,
		private $config: IConfiguration) {
	}

	public call<Т>(name: string, method: string, path: string, accept: string, bodyValues: Server.IRequestBodyElement[], resultStream: WritableStream): IFuture<Т> {
		return <any> (() => {
			var headers: any = {
				"X-Icenium-SolutionSpace": this.solutionSpaceName || this.$config.SOLUTION_SPACE_NAME
			};

			if (this.shouldAuthenticate) {
				headers.Cookie = ".ASPXAUTH=" + this.$userDataStore.getCookie().wait();
			}

			if (accept) {
				headers.Accept = accept;
			}

			var requestOpts: any = {
				proto: this.$config.AB_SERVER_PROTO,
				host: this.$config.AB_SERVER,
				path: "/api" + path,
				method: method,
				headers: headers,
				pipeTo: resultStream
			};

			if (bodyValues) {
				if (bodyValues.length > 1) {
					throw new Error("TODO: CustomFormData not implemented");
				}

				var theBody = bodyValues[0];
				requestOpts.body = theBody.value;
				requestOpts.headers["Content-Type"] = theBody.contentType;
			}

			try {
				var response = this.$httpClient.httpRequest(requestOpts).wait();
			} catch (err) {
				if (err.response && err.response.statusCode === 401) {
					this.$userDataStore.clearLoginData().wait();
				}
				throw err;
			}

			this.$logger.debug("%s (%s %s) returned %d", name, method, path, response.response.statusCode);
			var newCookies = response.headers["set-cookie"];

			if (newCookies) {
				this.lastCallCookies = {};
				newCookies.forEach((cookieStr: string) => {
					var parsed = cookielib.parse(cookieStr);
					Object.keys(parsed).forEach((key) => this.lastCallCookies[key] = parsed[key]);
				});
			}

			var resultValue = accept === "application/json" ? JSON.parse(response.body) : response.body;

			if (this.lastCallCookies) {
				var abAuthCookie = this.lastCallCookies['.ASPXAUTH'];
				if (abAuthCookie) {
					this.$logger.debug("Cookie is '%s'", abAuthCookie);
					this.$userDataStore.setCookie(abAuthCookie).wait();
				}
			}

			return resultValue;

		}).future()();
	}

	public getLastRequestCookies(): any {
		return this.lastCallCookies;
	}

	public setShouldAuthenticate(shouldAuthenticate: boolean): void {
		this.shouldAuthenticate = shouldAuthenticate;
	}

	public setSolutionSpaceName(solutionSpaceName: string): void {
		this.solutionSpaceName = solutionSpaceName;
	}
}
$injector.register("serviceProxy", ServiceProxy);

enum CodeEntityType {
	Line,
	Block
}

interface ICodeEntity {
	codeEntityType(): CodeEntityType;
}

class Line implements ICodeEntity {
	public content: string;

	codeEntityType(): CodeEntityType {
		return CodeEntityType.Line;
	}

	public static create(content): Line {
		return new Line(content);
	}

	constructor(content: string) {
		this.content = content;
	}
}

class Block implements ICodeEntity {
	public opener: string;
	public codeEntities: ICodeEntity[];

	codeEntityType(): CodeEntityType {
		return CodeEntityType.Block;
	}

	constructor(opener?: string) {
		if (opener) {
			this.opener = opener;
		}
		this.codeEntities = new Array();
	}

	public addBlocks(blocks: Block[]): void {
		_.each(blocks, (block) => {
			this.addBlock(block);
		});
	}

	public addBlock(block: Block): void {
		this.codeEntities.push(block);
	}

	public addLines(lines: Line[]): void {
		_.each(lines, (line) => {
			this.addLine(line);
		});
	}

	public addLine(line: Line): void {
		this.codeEntities.push(line);
	}

	public writeLine(content: string): void {
		var line = Line.create(content);
		this.addLine(line);
	}

	public toString(): string {
		var printer: SwaggerCodePrinter = new SwaggerCodePrinter();
		return printer.composeBlock(this, 0);
	}
}

class SwaggerCodePrinter {
	constructor(private indentChar: string = "\t",
		private newLineChar: string = os.EOL,
		private startBlockChar: string = "{",
		private endBlockChar: string = "}") {}

	public composeBlock(block: Block, indentSize: number = 0): string {
		var content: string = this.getIndentation(indentSize);

		if (block.opener) {
			content += block.opener;
			content += this.startBlockChar;
			content += this.newLineChar;
		}

		for(var i = 0; i < block.codeEntities.length; i++) {
			if (block.codeEntities[i].codeEntityType() === CodeEntityType.Line) {
				content += this.composeLine(<Line>block.codeEntities[i], indentSize + 1);
			} else if (block.codeEntities[i].codeEntityType() === CodeEntityType.Block) {
				content += this.composeBlock(<Block>block.codeEntities[i], indentSize + 1);
			}
		}

		if (block.opener) {
			content += this.getIndentation(indentSize) + this.endBlockChar;
		}
		content += this.newLineChar;
		return content;
	}

	public composeLine(line: Line, indentSize: number): string {
		var content: string = this.getIndentation(indentSize);
		content += line.content;
		content += this.newLineChar;
		return content;
	}

	private getIndentation(indentSize: number) {
		return Array(indentSize).join(this.indentChar);
	}
}

export class ServiceContractProvider implements Server.IServiceContractProvider {
	constructor(private $httpClient: Server.IHttpClient,
		private $config: IConfiguration) {
	}

	getApi(path?: string): IFuture<Server.SwaggerContract.ISwagger> {
		return (() => {
			var request: any = {
				proto: this.$config.AB_SERVER_PROTO,
				host: this.$config.AB_SERVER,
				path: "/api/swagger",
				method: "GET"
			};

			if (path) {
				request.path += path;
			}

			var result = this.$httpClient.httpRequest(request).wait();
			if (result.error) {
				throw result.error;
			} else {
				return JSON.parse(result.body);
			}
		}).future<Server.SwaggerContract.ISwagger>()();
	}
}
$injector.register("serviceContractProvider", ServiceContractProvider);

export class ServiceContractGenerator implements Server.IServiceContractGenerator {
	private pendingModels;

	constructor(private $serviceContractProvider: Server.IServiceContractProvider) {
	}

	public generate(): Server.IServiceContractClientCode {
		var swagger: Server.SwaggerContract.ISwagger = <Server.SwaggerContract.ISwagger>this.$serviceContractProvider.getApi().wait();
		var interfacesFile: Block = new Block();
		var implementationsFile: Block = new Block();

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
		interfacesFile.writeLine("// automatically generated code; do not edit manually!")
		interfacesFile.writeLine("//");
		interfacesFile.writeLine("///<reference path=\".d.ts\"/>");

		var serverModuleName = "Server";
		var serverModuleDeclaration = new Block("declare module " + serverModuleName);
		serverModuleDeclaration.toString();

		var serverClass = new Block("export class ServiceContainer implements Server.IServer");
		var serverInterface = new Block("interface IServer");

		_.each(swagger.apis, (apiPath: Server.SwaggerContract.ISwaggerApiPath) => {
			this.pendingModels = {};

			var swaggerService = <Server.SwaggerContract.ISwaggerService>this.$serviceContractProvider.getApi(apiPath.path).wait();

			var models: Block[] = this.generateModels(swaggerService.models);
			serverModuleDeclaration.addBlocks(models);

			var service: IService = this.generateService(swaggerService, serverModuleName);

			Object.keys(this.pendingModels).forEach((modelName: string) => {
				var model = this.pendingModels[modelName];
				if (model) {
					serverModuleDeclaration.addBlock(model);
				}
			});

			serverModuleDeclaration.addBlock(service.serviceInterface);
			implementationsFile.addBlock(service.serviceImplementation);

			var serviceName = swaggerService.resourcePath.substr(1);

			serverInterface.writeLine(util.format("%s: Server.I%sServiceContract;", serviceName, this.toPascalCase(serviceName)));
			serverClass.writeLine(util.format("public %s: Server.I%sServiceContract = $injector.resolve(%sService);",
				serviceName, this.toPascalCase(serviceName), this.toPascalCase(serviceName)));
		});
		serverModuleDeclaration.addBlock(serverInterface);
		interfacesFile.addBlock(serverModuleDeclaration);

		implementationsFile.addBlock(serverClass);
		implementationsFile.writeLine("$injector.register('server', ServiceContainer);");

		var codePrinter = new SwaggerCodePrinter();
		return {
			interfaceFile: codePrinter.composeBlock(interfacesFile),
			implementationFile: codePrinter.composeBlock(implementationsFile)
		};
	}

	private generateModels(swaggerApiModels: any): Block[] {
		var modelsBlocks: Block[] = [];
		_.each(swaggerApiModels, (model: Server.SwaggerContract.ISwaggerModel, modelName: string) => {
			var typeName = TSTypeSystemHelpers.translate(modelName);
			if (!TSTypeSystemHelpers.isModel(typeName)) {
				this.visitModel(modelName, model);

				if (TSTypeSystemHelpers.isModel(typeName)) {
					modelsBlocks.push(this.generateModel(modelName, model));
				}
			}
		});
		return modelsBlocks;
	}

	private visitModel(modelName: string, model: Server.SwaggerContract.ISwaggerModel): void {
		if (!TSTypeSystemHelpers.isGeneric(modelName)) {
			var modelName = TSTypeSystemHelpers.translate(modelName);
			TSTypeSystemHelpers.addModel(modelName);
		}

		Object.keys(model.properties).forEach((propertyName) => {
			this.visitModelProperty(model, propertyName);
		});
	}

	private visitModelProperty(model: Server.SwaggerContract.ISwaggerModel, propertyName: string) {
		if (model.properties[propertyName].allowableValues) {
			TSTypeSystemHelpers.addModel(model.properties[propertyName].allowableValues.valueType);
			this.ensureEnumAdded(model.properties[propertyName].allowableValues);
		}
	}

	private generateModel(modelName: string, model: Server.SwaggerContract.ISwaggerModel): any {
		var modelBlock: Block = new Block(util.format("interface %s", modelName));
		Object.keys(model.properties).forEach((propertyName) => {
			var typeName = this.getModelPropertyTypeName(model, propertyName);

			if (!TSTypeSystemHelpers.isBuiltIn(typeName)) {
				typeName = "Server." + typeName;
			}

			modelBlock.writeLine(util.format("%s: %s;", propertyName, typeName));
		});
		return modelBlock;
	}

	private getModelPropertyTypeName(model: Server.SwaggerContract.ISwaggerModel, propertyName: string): string {
		var typeName: string;
		if (model.properties[propertyName].items) {
			typeName = model.properties[propertyName].items.$ref + "[]";
		} else {
			typeName = TSTypeSystemHelpers.translate(model.properties[propertyName].type);
		}

		return typeName;
	}

	private generateService(swaggerService: Server.SwaggerContract.ISwaggerService, serverModuleName: string): IService {
		var swaggerServiceContractName = this.getSwaggerServiceContractName(swaggerService);

		var serviceInterface = new Block(util.format("interface %s", swaggerServiceContractName));
		var serviceImplementation = new Block(util.format("export class %s implements %s.%s", this.getSwaggerServiceName(swaggerService), serverModuleName,
			swaggerServiceContractName));
		serviceImplementation.addBlock(new Block(util.format("constructor(private $serviceProxy: %s.IServiceProxy)", serverModuleName)));

		_.each(swaggerService.apis, (api: Server.SwaggerContract.ISwaggerApi) => {
			_.each(api.operations, (operation: Server.SwaggerContract.ISwaggerOperation) => {
				if (!this.hasFormParamType(operation)) {
					var generatedOperation: IServiceEndpoint = this.generateOperation(operation, swaggerService.basePath, api.path);
					serviceInterface.addLine(generatedOperation.endpointInterface);
					serviceImplementation.addBlock(generatedOperation.endpointImplementation);
				}
			});
		});

		return {serviceInterface: serviceInterface, serviceImplementation: serviceImplementation};
	}

	private getSwaggerServiceContractName(swaggerService: Server.SwaggerContract.ISwaggerService): string {
		var swaggerServiceName = this.getSwaggerServiceClassName(swaggerService);
		return util.format("I%sServiceContract", swaggerServiceName);
	}

	private getSwaggerServiceName(swaggerService: Server.SwaggerContract.ISwaggerService): string {
		var swaggerServiceName = this.getSwaggerServiceClassName(swaggerService);
		return util.format("%sService", swaggerServiceName);
	}

	private getSwaggerServiceClassName(swaggerService: Server.SwaggerContract.ISwaggerService): string {
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

	private hasFormParamType(operation: Server.SwaggerContract.ISwaggerOperation): boolean {
		return !!_.find(operation.parameters, (parameter) => this.isParameterOfType(parameter, ParamTypes.Form));
	}

	private generateOperation(operation: Server.SwaggerContract.ISwaggerOperation, basePath: string, path: string): IServiceEndpoint {
		var operationContractName = this.getOperationContractName(operation);
		var parameters: string[] = [];

		var enumPathParameters = {};
		operation.parameters.sort((parameter: Server.SwaggerContract.ISwaggerParameter, otherParameter: Server.SwaggerContract.ISwaggerParameter) => {
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
		_.each(pathParams, (parameter: Server.SwaggerContract.ISwaggerParameter) => {
			if (parameter.allowableValues !== undefined && parameter.dataType === "string") {
				TSTypeSystemHelpers.addModel(parameter.allowableValues.valueType);
				this.ensureEnumAdded(parameter.allowableValues);
				enumPathParameters[parameter.name] = "Server." + TSTypeSystemHelpers.translate(parameter.allowableValues.valueType);
			}
		});

		_.each(operation.parameters, (parameter: Server.SwaggerContract.ISwaggerParameter) => {
			var tsTypeName = TSTypeSystemHelpers.translate(parameter.dataType);
			if (TSTypeSystemHelpers.isStream(tsTypeName)) {
				tsTypeName = TSTypeSystemHelpers.getReadableStreamTypeName();
			} else if (parameter.allowableValues) {
				TSTypeSystemHelpers.addModel(parameter.allowableValues.valueType);
				this.ensureEnumAdded(parameter.allowableValues);
				tsTypeName = TSTypeSystemHelpers.translate(parameter.allowableValues.valueType);
			}

			if (!TSTypeSystemHelpers.isBuiltIn(tsTypeName)) {
				tsTypeName = "Server." + tsTypeName;
			}

			parameter.name = this.escapeKeyword(parameter.name);
			parameters.push(util.format("%s: %s", parameter.name, tsTypeName));
		});

		var responseType = TSTypeSystemHelpers.translate(operation.responseClass);
		if (!TSTypeSystemHelpers.isBuiltIn(responseType)) {
			responseType = "Server." + responseType;
		}

		var httpCallParameters: string[] = [this.quote(operation.nickname), this.quote(operation.httpMethod)];
		httpCallParameters.push(this.generateHttpCallPath(operation, basePath, path, enumPathParameters));
		httpCallParameters.push(this.quote(this.getAccepts(operation)));
		httpCallParameters.push(this.generateBodyParams(operation));

		if (TSTypeSystemHelpers.isStream(responseType)) {
			parameters.push("$resultStream: " + TSTypeSystemHelpers.getWritableStreamTypeName());
			httpCallParameters.push("$resultStream");
		} else {
			httpCallParameters.push("null");
		}

		var callResultType = TSTypeSystemHelpers.isStream(responseType) ? "void" : responseType;
		var generatedContract = Line.create(util.format("%s(%s): IFuture<%s>;", operationContractName, parameters.join(", "), callResultType));
		var generatedOperation = new Block(util.format("public %s(%s): IFuture<%s>", operationContractName, parameters.join(", "), callResultType));
		generatedOperation.writeLine(util.format("return this.$serviceProxy.call<%s>(%s);", callResultType, httpCallParameters.join(", ")));

		return {endpointInterface: generatedContract, endpointImplementation: generatedOperation};
	}

	private ensureEnumAdded(allowableValues: Server.SwaggerContract.ISwaggerModelPropertyAllowableValues) {
		var typeName = TSTypeSystemHelpers.translate(allowableValues.valueType);
		if (!this.pendingModels[typeName]) {
			var enumBlock = new Block(util.format("enum %s", typeName));
			_.each(allowableValues.values, (value: string) => {
				enumBlock.writeLine(util.format("%s,", value));
			});
		}
		this.pendingModels[typeName] = enumBlock;
	}

	private getOperationContractName(operation: Server.SwaggerContract.ISwaggerOperation): string {
		return this.toCamelCase(operation.nickname);
	}

	private generateHttpCallPath(operation: Server.SwaggerContract.ISwaggerOperation, basePath: string, path: string, enumPathParameters: any): string {
		var components: string[] = _.filter(path.split("/"), (component) => !!component && !!component.trim());
		var pathComponents: string[] = _.map(components, (pathComponent: string) => {
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

		var fullPath = [];
		_.each(basePath.split("/"), (part) => {
			if (part) {
				fullPath.push(this.quote(part));
			}
		});
		fullPath = fullPath.concat(pathComponents);

		var path = util.format("[%s].join('/')", fullPath.toString());

		var queryParams: Server.SwaggerContract.ISwaggerParameter[] = this.getSwaggerParamsByType(operation, ParamTypes.Query);
		if (queryParams.length > 0) {
			path += util.format(" + '?' + querystring.stringify({ %s })",
				_.map(queryParams, (param) => util.format("'%s': %s", param.name, param.name)).join(", "));
		}
		return path;
	}

	private getAccepts(operation: Server.SwaggerContract.ISwaggerOperation): string {
		if (TSTypeSystemHelpers.isStream(operation.responseClass)) {
			return "application/octet-stream";
		}
		return "application/json";
	}

	private generateBodyParams(operation: Server.SwaggerContract.ISwaggerOperation): string {
		var bodyParams: Server.SwaggerContract.ISwaggerParameter[] = this.getSwaggerParamsByType(operation, ParamTypes.Body);
		var result: string[] = [];
		_.each(bodyParams, (bodyParam: Server.SwaggerContract.ISwaggerParameter) => {
			result.push(util.format("{name: %s, value: %s, contentType: %s}",
				this.quote(bodyParam.name), bodyParam.name, this.quote(this.getContentType(bodyParam.dataType))));
		});

		if (result.length == 0) {
			return "null";
		}
		return "[" + result.toString() + "]";
	}

	private getSwaggerParamsByType(operation: Server.SwaggerContract.ISwaggerOperation, paramType: ParamTypes): Server.SwaggerContract.ISwaggerParameter[] {
		return _.filter(operation.parameters, (parameter: Server.SwaggerContract.ISwaggerParameter) => {
			return this.isParameterOfType(parameter, paramType);
		});
	}

	private getParameterType(parameter: Server.SwaggerContract.ISwaggerParameter): ParamTypes {
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

	private isParameterOfType(parameter: Server.SwaggerContract.ISwaggerParameter, paramType: ParamTypes) {
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

	private getContentType(typeName: string): string {
		if (TSTypeSystemHelpers.isStream(typeName)) {
			return "application/octet-stream";
		}
		return "application/json";
	}
}
$injector.register("serviceContractGenerator", ServiceContractGenerator);

enum ParamTypes {
	Path,
	Query,
	Body,
	Form
}

class TSTypeSystemHelpers {
	private static models: boolean[] = [];

	public static translate(typeName: string): string {
		if (typeName === "int" || typeName === "long" ||
			typeName === "double" || typeName === "float") {
			return "number";
		}

		if (TSTypeSystemHelpers.isGeneric(typeName)) {
			return TSTypeSystemHelpers.translateGenericTypeName(typeName);
		}

		// sample lines are "Map[string,boolean]", "Map[string,Tuple<string,MigrationType>]"
		if (typeName.startsWith("Map")) {
			var keyStartIndex = typeName.indexOf("[") + 1;
			var keyValueSeparatorIndex = typeName.indexOf(",");
			var key = typeName.substr(keyStartIndex, keyValueSeparatorIndex - keyStartIndex);
			if (key !== "string") {
				return "any";
			} else {
				var value = typeName.substr(keyValueSeparatorIndex + 1, typeName.indexOf("]") - keyValueSeparatorIndex - 1);
				return util.format("StringMap<%s>", TSTypeSystemHelpers.translate(value));
			}
		}

		// smaple line is "List[string]"
		var match = /List\[(.+)\]/.exec(typeName);
		if (match) {
			return TSTypeSystemHelpers.translate(match[1]) + "[]";
		}

		return typeName;
	}

	public static isGeneric(typeName: string) {
		return typeName.indexOf("<") > 0;
	}

	private static translateGenericTypeName(typeName: string): string {
		return "any";
	}

	public static addModel(name: string): void {
		TSTypeSystemHelpers.models[name] = true;
	}

	public static isModel(name: string): boolean {
		return !!TSTypeSystemHelpers.models[name] ||
			(name.length > 2 && !!TSTypeSystemHelpers.models[name.substr(0, name.length - 2)]);
	}

	public static isBuiltIn(name: string): boolean {
		var builtInTypes = ["StringMap", "boolean", "number", "string", "Date", "void",
			"ReadableStream", "WritableStream", "any"];
		var result: boolean = !!_.find(builtInTypes, (builtInType: string) => {
			return name.startsWith(builtInType);
		});
		return result;
	}

	public static isStream(typeName: string): boolean {
		var tsTypeName = this.translate(typeName);
		return tsTypeName.endsWith("Stream") || tsTypeName.endsWith("file");
	}

	public static getWritableStreamTypeName(): string {
		return "any";
	}

	public static getReadableStreamTypeName(): string {
		return "any";
	}
}

interface IService {
	serviceInterface: Block;
	serviceImplementation: Block;
}

interface IServiceEndpoint {
	endpointInterface: Line;
	endpointImplementation: Block;
}

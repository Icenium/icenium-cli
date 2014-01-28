///<reference path=".d.ts"/>

"use strict";

import config = require("./config");
import util = require("util");
import Future = require("fibers/future");
import cookielib = require("cookie");
import Url = require("url");
import helpers = require("./helpers");
var _ = <UnderscoreStatic> require("underscore");

export class HttpClient implements Server.IHttpClient {
	constructor(private $logger: ILogger) {}

	httpRequest(options): IFuture<Server.IResponse> {
		if (_.isString(options)) {
			options = {
				url: options,
				method: "GET"
			}
		}

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

		var requestProto =  options.proto || "http";
		delete options.proto;
		var body = options.body;
		delete options.body;
		var pipeTo = options.pipeTo;
		delete options.pipeTo;

		var proto = config.PROXY_TO_FIDDLER ? "http" : requestProto;
		var http = require(proto);

		options.headers = options.headers || {};

		if (config.PROXY_TO_FIDDLER) {
			options.path = requestProto + "://" + options.host + options.path;
			options.headers.Host = options.host;
			options.host = "127.0.0.1";
			options.port = 8888;
		}

		var result = new Future<Server.IResponse>();

		var request = http.request(options, (response) => {
			var data = "";

			var callback = function(responseResult: Server.IResponse) {
				if (responseResult.error) {
					result.throw(responseResult.error);
				} else {
					result.return(responseResult);
				}
			}

			if (!pipeTo) {
				response.on("data", (chunk) => {
					this.$logger.trace("httpRequest: Receiving data:\n" + chunk);
					data += chunk;
				});
			}

			if (pipeTo) {
				pipeTo.on("finish", () => {
					this.$logger.trace("httpRequest: Piping done. code = %d", response.statusCode);
					callback({
						response: response,
						headers: response.headers
					});
				});
				response.on("end", () => {
					pipeTo.end();
				});

				response.pipe(pipeTo);
			} else {
				response.on("end", () => {
					this.$logger.trace("httpRequest: Done. code = %d", response.statusCode);
					callback({
						body: data,
						response: response,
						headers: response.headers,
						error: helpers.isRequestSuccessful(response) ? null : new Error(response.statusCode)
					});
				});
			}
		});

		this.$logger.trace("httpRequest: Sending:\n%s", body);

		if (!body || !body.pipe) {
			request.end(body);
		} else {
			body.pipe(request);
		}

		return result;
	}
}
$injector.register("httpClient", HttpClient);

//TODO: append " implements Server.IServiceProxy" when the bug in the TypeScript compiler that prevents it is fixed.
export class ServiceProxy {
	private lastCallCookies: any;
	private shouldAuthenticate: boolean = true;

	constructor(private $httpClient: Server.IHttpClient,
		private $userDataStore: IUserDataStore,
		private $logger: ILogger) {
	}

	public call<Т>(name: string, method: string, path: string, accept: string, bodyValues: Server.IRequestBodyElement[], resultStream: WritableStream): IFuture<Т> {
		var headers: any = {
			"X-Icenium-SolutionSpace": config.SOLUTION_SPACE_NAME
		};

		if (this.shouldAuthenticate) {
			headers.Cookie = ".ASPXAUTH=" + this.$userDataStore.getCookie().wait();
		}

		if (accept) {
			headers.Accept = accept;
		}

		var requestOpts: any = {
			proto: config.AB_SERVER_PROTO,
			host: config.AB_SERVER,
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

		var response = this.$httpClient.httpRequest(requestOpts);
		var result = new Future<any>();
		response.resolveSuccess((response) => {
			this.$logger.debug("%s (%s %s) returned %d", name, method, path, response.response.statusCode);
			if (response.error) {
				result.throw(response.error);
			} else {
				var newCookies = response.headers["set-cookie"];

				if (newCookies) {
					this.lastCallCookies = {};
					newCookies.forEach((cookieStr: string) => {
						var parsed = cookielib.parse(cookieStr);
						Object.keys(parsed).forEach((key) => this.lastCallCookies[key] = parsed[key]);
					});
				}

				if (accept === "application/json") {
					result.return(JSON.parse(response.body));
				} else {
					result.return(response.body);
				}
			}
		});

		return result;
	}

	public getLastRequestCookies(): any {
		return this.lastCallCookies;
	}

	public setShouldAuthenticate(shouldAuthenticate: boolean): void {
		this.shouldAuthenticate = shouldAuthenticate;
	}
}
$injector.register("serviceProxy", ServiceProxy);

function quote(s: string): string {
	return "'" + s + "'";
}

function escapeKeyword(s: string): string {
	switch (s) {
		case "package":
			return s + "_";
		default:
			return s;
	}
}

function toClassName(contractName: string): string {
	return contractName.replace(/I(\w+)Contract/, "$1");
}

class CodePrinter {
	private indent = "";
	private lines = [];

	public pushIndent(): void {
		this.indent += "\t";
	}

	public popIndent(): void {
		this.indent = this.indent.substr(1);
	}

	public writeLine(lineFormat?: string, ...args: any[]) {
		if (!lineFormat) {
			this.lines.push("");
		} else {
			if (lineFormat.endsWith("}")) {
				this.popIndent();
				lineFormat += "\r\n";
			}

			args.unshift(lineFormat);
			this.lines.push(this.indent + util.format.apply(null, args));

			if (lineFormat.endsWith("{")) {
				this.pushIndent();
			}
		}
	}

	public toString(): string {
		return this.lines.join("\r\n");
	}
}

export class ServiceContractProvider implements Server.IServiceContractProvider {
	constructor(private $httpClient: Server.IHttpClient) {
	}

	getApi(): Server.Contract.IService[] {
		var req:any = {
			proto: config.AB_SERVER_PROTO,
			host: config.AB_SERVER,
			path: "/api",
			method: "GET"
		};

		var result = this.$httpClient.httpRequest(req).wait();
		if (result.error) {
			throw result.error;
		} else {
			return JSON.parse(result.body);
		}
	}
}
$injector.register("serviceContractProvider", ServiceContractProvider);

export class ServiceContractGenerator implements Server.IServiceContractGenerator {
	constructor(private $serviceContractProvider: Server.IServiceContractProvider) {
	}

	public generate(): Server.IServiceContractClientCode {
		var api = this.$serviceContractProvider.getApi();

		var intf = new CodePrinter();
		var impl = new CodePrinter();
		impl.writeLine("///<reference path=\".d.ts\"/>");
		impl.writeLine("//");
		impl.writeLine("// automatically generated code; do not edit manually!")
		impl.writeLine("//");
		impl.writeLine("\"use strict\";");
		impl.writeLine();
		impl.writeLine("import querystring = require('querystring');");
		impl.writeLine();

		intf.writeLine("//");
		intf.writeLine("// automatically generated code; do not edit manually!")
		intf.writeLine("//");
		intf.writeLine("declare module Server {");

		api.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});

		for (var i = 0; i < api.length; ++i) {
			var intfName = api[i].name;
			intf.writeLine("interface %s {", intfName);
			var className = toClassName(intfName);
			impl.writeLine("export class %s implements Server.%s {", className, intfName);
			impl.writeLine("constructor(private $serviceProxy: Server.IServiceProxy) {");
			impl.writeLine("}");

			var operations = api[i].operations;
			operations.sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});

			for (var oi = 0; oi < operations.length; ++oi) {
				var op = operations[oi];
				var paramNames = _.map(op.parameters, (p) => escapeKeyword(p.name) + ": " + (p.binding.type === "Body" ? "any" : "string"));

				if (op.responseType === "application/octet-stream") {
					paramNames.push("$resultStream: any");
				}

				var returnType = op.responseType && op.responseType !== "application/octet-stream" ? "any" : "void";

				var signature = util.format("%s(%s): IFuture<%s>",
					op.name[0].toLowerCase() + op.name.substr(1),
					paramNames.join(", "), returnType);

				var actionPath = _.filter(
					["/" + api[i].endpoint].concat(op.routePrefixes, [op.actionName]),
					(part) => !!part).join("/");
				var pathComponents = [quote(actionPath)];
				var queryParams = [];

				intf.writeLine(signature + ";");
				impl.writeLine(signature + " {");

				var bodyParams = [];

				for (var pi = 0; pi < op.parameters.length; ++pi) {
					var param = op.parameters[pi];

					var paramName = escapeKeyword(param.name);

					switch (param.binding.type) {
						case "Route":
							if (param.routePrefixes && param.routePrefixes.length > 0) {
								pathComponents.push("'" + param.routePrefixes.join("/") + "'");
							}
							pathComponents.push(util.format("encodeURI(%s.replace(/\\\\/g, '/'))", paramName));
							if (param.routeSuffixes && param.routeSuffixes.length > 0) {
								pathComponents.push("'" + param.routeSuffixes.join("/") + "'");
							}
							break;

						case "Query":
							queryParams.push(paramName);
							break;

						case "Body":
							var contentType = param.binding.contentType;
							if (contentType === "application/json") {
								paramName = util.format("JSON.stringify(%s)", paramName);
							}
							bodyParams.push(util.format("{name: '%s', value: %s, contentType: %s}",
								param.name, paramName, contentType ? quote(contentType) : "null"));
							break;
					}
				}

				if (op.routeSuffixes && op.routeSuffixes.length > 0) {
					pathComponents.push("'" + op.routeSuffixes.join("/") + "'");
				}

				var pathVar: string;

				if (pathComponents.length === 1) {
					pathVar = pathComponents[0];
				} else {
					pathVar = util.format("[%s].join('/')", pathComponents.join(", "));
				}
				if (queryParams.length > 0) {
					pathVar += util.format(" + '?' + querystring.stringify({ %s })",
						_.map(queryParams, (p) => util.format("'%s': %s", p, p)).join(", "));
				}

				var args = [quote(op.name), quote(op.httpMethod), pathVar];
				args.push(op.responseType ? quote(op.responseType) : "null");

				switch (bodyParams.length) {
					case 0:
						args.push("null");
						break;
					default:
						args.push(util.format("[%s]", bodyParams.join(", ")));
						break;
				}

				args.push(op.responseType === "application/octet-stream" ? "$resultStream" : "null");

				impl.writeLine("return this.$serviceProxy.call<%s>(%s);", returnType, args.join(", "));
				impl.writeLine("}");
			}

			intf.writeLine("}");
			impl.writeLine("}");
		}

		intf.writeLine("interface IServer {");
		impl.writeLine("export class Server {");
		for (var i = 0; i < api.length; ++i) {
			intf.writeLine("%s: %s;", api[i].endpoint, api[i].name);
			impl.writeLine("public %s = $injector.resolve(%s);", api[i].endpoint, toClassName(api[i].name));
		}
		intf.writeLine("}");
		impl.writeLine("}");
		impl.writeLine("$injector.register('server', Server);");

		intf.writeLine("}");

		return {
			interfaceFile: intf.toString(),
			implementationFile: impl.toString()
		};
	}
}
$injector.register("serviceContractGenerator", ServiceContractGenerator);
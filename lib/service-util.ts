///<reference path=".d.ts"/>

"use strict";

import config = require("./config");
import server = require("./server");
import login = require("./login");
import util = require("util");
import fs = require("fs");
import path = require("path");
var _ = <UnderscoreStatic> require("underscore");

export class ServiceProxy implements Server.IServiceProxy {
	constructor(private $httpClient: Server.IHttpClient) {
	}

	public call(method: string, path: string, accept: string, body: any, resultStream: WritableStream): any {
		var headers: any = {
			"X-Icenium-SolutionSpace": config.SOLUTION_SPACE_NAME,
			"Cookie": ".ASPXAUTH=" + login.getCookie()
		};

//		if (method !== "POST" && method !== "PUT" && method !== "GET" && method !== "DELETE") {
//			headers["X-HTTP-Method-Override"] = method;
//			method = "POST";
//		}


		if (accept) {
			headers.Accept = accept;
		}

		if (_.isArray(body)) {
			throw new Error("TODO: CustomFormData not implemented");
		}

		var requestOpts: any = {
			proto: config.ICE_SERVER_PROTO,
			host: config.ICE_SERVER,
			path: "/api" + path,
			method: method,
			headers: headers,
			body: body,
			pipeTo: resultStream
		};

		var result = this.$httpClient.httpRequest(requestOpts);

		if (result.error) {
			throw result.error;
		} else {
			if (accept === "application/json") {
				return JSON.parse(result.body);
			} else {
				return result.body;
			}
		}
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
			proto: config.ICE_SERVER_PROTO,
			host: config.ICE_SERVER,
			path: "/api",
			method: "GET"
		};

		var result = this.$httpClient.httpRequest(req);
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

	public generate(): void {
		var api = this.$serviceContractProvider.getApi();

		var intf = new CodePrinter();
		var impl = new CodePrinter();
		impl.writeLine("///<reference path=\".d.ts\"/>");
		impl.writeLine("\"use strict\";");
		impl.writeLine();
		impl.writeLine("import querystring = require('querystring');");
		impl.writeLine();

		intf.writeLine("declare module Server {");

		api.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});

		for (var i = 0; i < api.length; ++i) {
			intf.writeLine("interface %s {", api[i].name);
			var className = toClassName(api[i].name);
			impl.writeLine("export class %s {", className);
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
					paramNames.push("$resultStream: WritableStream");
				}

				var returnsBody = op.responseType && op.responseType !== "application/octet-stream";

				var signature = util.format("%s(%s): %s",
					op.name[0].toLowerCase() + op.name.substr(1),
					paramNames.join(", "), returnsBody ? "any" : "void");

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
							bodyParams.push(paramName);
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

				var args = [quote(op.httpMethod), pathVar];
				args.push(op.responseType ? quote(op.responseType) : "null");

				switch (bodyParams.length) {
					case 0:
						args.push("null");
						break;
					case 1:
						args.push(bodyParams[0]);
						break;
					default:
						args.push(util.format("[%s]", bodyParams.join(", ")));
						break;
				}

				args.push(op.responseType === "application/octet-stream" ? "$resultStream" : "null");

				impl.writeLine("%sthis.$serviceProxy.call(%s);",
					returnsBody ? "return " : "",
					args.join(", "));
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

		fs.writeFileSync(path.join(__dirname, "service-proxy.d.ts"), intf.toString());
		fs.writeFileSync(path.join(__dirname, "service-proxy.ts"), impl.toString());
	}
}
$injector.register("serviceContractGenerator", ServiceContractGenerator);
///<reference path=".d.ts"/>

"use strict";

import util = require("util");
import Future = require("fibers/future");
import progress = require('progress-stream');
import filesize = require('filesize');
import Url = require("url");
import helpers = require("./helpers");
import zlib = require("zlib");

export class ServiceProxy implements Server.IServiceProxy {
	private latestVersion: string = null;
	private shouldAuthenticate: boolean = true;
	private solutionSpaceName: string;

	constructor(private $httpClient: Server.IHttpClient,
		private $userDataStore: IUserDataStore,
		private $logger: ILogger,
		private $config: IConfiguration,
		private $staticConfig: IStaticConfig,
		private $errors: IErrors) {
	}

	public call<Т>(name: string, method: string, path: string, accept: string, bodyValues: Server.IRequestBodyElement[], resultStream: WritableStream, headers?: any): IFuture<Т> {
		return(() => {
			this.ensureUpToDate().wait();
			headers = headers || Object.create(null);

			headers["X-Icenium-SolutionSpace"] = this.solutionSpaceName || this.$staticConfig.SOLUTION_SPACE_NAME;

			if (this.shouldAuthenticate) {
				var cookies = this.$userDataStore.getCookies().wait();
				if (cookies) {
					var cookieValues = _.map(_.pairs(cookies), pair => util.format("%s=%s", pair[0], pair[1]));
					headers.Cookie = cookieValues.join("; ");
				}
			}

			if (accept) {
				headers.Accept = accept;
			}

			var requestOpts: any = {
				proto: this.$config.AB_SERVER_PROTO,
				host: this.$config.AB_SERVER,
				path: "/appbuilder/" + path,
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
			} catch(err) {
				if (err.response && err.response.statusCode === 401) {
					this.$userDataStore.clearLoginData().wait();
				} else if (err.response && err.response.statusCode === 402) {
					this.$errors.fail({formatStr: "%s", suppressCommandHelp: true}, JSON.parse(err.body).Message);
				}
				throw err;
			}

			this.$logger.debug("%s (%s %s) returned %d", name, method, path, response.response.statusCode);
			var newCookies = response.headers["set-cookie"];

			if (newCookies) {
				this.$userDataStore.parseAndSetCookies(newCookies, cookies).wait();
			}

			var resultValue = accept === "application/json" ? JSON.parse(response.body) : response.body;
			return resultValue;
		}).future<any>()();
	}

	public setShouldAuthenticate(shouldAuthenticate: boolean): void {
		this.shouldAuthenticate = shouldAuthenticate;
	}

	public setSolutionSpaceName(solutionSpaceName: string): void {
		this.solutionSpaceName = solutionSpaceName;
	}

	private ensureUpToDate(): IFuture<void> {
		return (() => {
			try {
				if (!this.latestVersion) {
					this.latestVersion = JSON.parse(this.$httpClient.httpRequest("http://registry.npmjs.org/appbuilder").wait().body)["dist-tags"].latest;
				}
			}
			catch (error) {
				this.$logger.debug("Failed to retrieve version from npm");
				this.latestVersion = "0.0.0";
			}

			if (helpers.versionCompare(this.latestVersion, this.$staticConfig.version) > 0) {
				this.$errors.fail({ formatStr: "You are running an outdated version of the Telerik AppBuilder CLI. To run this command, you need to update to the latest version of the Telerik AppBuilder CLI. To update now, run 'npm update -g appbuilder'.", suppressCommandHelp: true });
			}
		}).future<void>()();
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
	private lines: string[] = [];

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
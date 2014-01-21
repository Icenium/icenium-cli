///<reference path=".d.ts"/>
"use strict";

import querystring = require("querystring");
import log = require("./logger");
import fs = require("fs");
import config = require("./config");
import login = require("./login");
import cookie = require("cookie");
import util = require("util");
import helpers = require("./helpers");
import Url = require("url");
import projectNameValidator = require("./validators/project-name-validator");
import Future = require("fibers/future");
import Fiber = require("fibers");
var _ = <UnderscoreStatic> require("underscore");

export class HttpClient implements Server.IHttpClient {
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

		var request = http.request(options, function (response) {
			var data = "";

			var callback = function(responseResult: Server.IResponse) {
				if (responseResult.error) {
					result.throw(responseResult.error);
				} else {
					result.return(responseResult);
				}
			}

			if (!pipeTo) {
				response.on("data", function (chunk) {
					log.trace("httpRequest: Receiving data:\n" + chunk);
					data += chunk;
				});
			}

			if (pipeTo) {
				pipeTo.on("finish", function() {
					log.trace("httpRequest: Piping done. code = %d", response.statusCode);
					callback({
						response: response,
						headers: response.headers
					});
				});
				response.on("end", function () {
					pipeTo.end();
				});

				response.pipe(pipeTo);
			} else {
				response.on("end", function () {
					log.trace("httpRequest: Done. code = %d", response.statusCode);
					callback({
						body: data,
						response: response,
						headers: response.headers,
						error: helpers.isRequestSuccessful(response) ? null : new Error(response.statusCode)
					});
				});
			}
		});

		log.trace("httpRequest: Sending:\n%s", body);

		if (!body || !body.pipe) {
			request.end(body);
		} else {
			body.pipe(request);
		}

		return result;
	}
}
$injector.register("httpClient", HttpClient);

//TODO: _bridge_ remove after refactoring
export function httpRequest(options, callback: (result: Server.IResponse) => void): void {
	Fiber(function () {
		var client = new HttpClient();
		var result = client.httpRequest(options);
		callback(result.wait());
	}).run();
}

//TODO: _bridge_ remove after refactoring
function getServer(): Server.IServer {
	return <Server.IServer> $injector.resolve("server");
}

export function authenticate(loginData, callback) {
	loginData.wrap_client_id = "uri:ice";

	httpRequest({
		proto: "https",
		host: config.TFIS_SERVER,
		path: "/Authenticate/WRAPv0.9",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: querystring.stringify(loginData)
	}, function (wrapResponse) {
		if (wrapResponse.error) {
			callback(wrapResponse.error);
			return;
		}

		var wrapData = querystring.parse(wrapResponse.body),
			wrap_access_token = wrapData.wrap_access_token;

		httpRequest({
			host: config.ICE_SERVER,
			path: "/api/authentication",
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(wrap_access_token)
		}, function (iceResponse) {
			var newCookies = iceResponse.headers["set-cookie"],
				token;

			if (newCookies) {
				newCookies.forEach(function(cookieStr) {
					var parsed = cookie.parse(cookieStr);
					Object.keys(parsed).forEach(function(key) {
						if (key.toUpperCase() === ".ASPXAUTH") {
							token = parsed[key];
						}
					});
				});
			}

			callback(null, {auth: token, user: JSON.parse(iceResponse.body)});
		});
	});
}

export function basicLogin(userName, password, callback) {
	var loginData = {
		wrap_username: userName,
		wrap_password: password,
	};

	authenticate(loginData, callback);
}

export function getLiveSyncUrl(urlKind: string, filesystemPath: string, liveSyncToken: string): IFuture<string> {
	return ((): string => {
		urlKind = urlKind.toLowerCase();
		if (urlKind !== "manifest" && urlKind !== "package") {
			throw new Error("urlKind must be either 'manifest' or 'package'");
		}

		var fullDownloadPath = util.format("%s://%s/Mist/MobilePackage/%s?packagePath=%s&token=%s",
			config.ICE_SERVER_PROTO,
			config.ICE_SERVER, urlKind,
			querystring.escape(querystring.escape(filesystemPath)),
			querystring.escape(querystring.escape(liveSyncToken)));
		log.debug("Minifying LiveSync URL '%s'", fullDownloadPath);

		var url = getServer().cordova.getLiveSyncUrl(fullDownloadPath).wait();
		if (urlKind === "manifest") {
			url = "itms-services://?action=download-manifest&amp;url=" + querystring.escape(url);
		}

		log.debug("Device install URL '%s'", url);

		return url;
	}).future<string>()();
}

export function buildProject(solutionName, projectName, solutionSpace, buildProperties): IFuture<Server.IBuildResult> {
	return ((): Server.IBuildResult => {
		log.info("Building project %s/%s (%s)", solutionName, projectName, solutionSpace);

		projectNameValidator.validateNameAndLogErrorMessage(projectName);

		getServer().projects.setProjectProperty(solutionName, projectName, { AppIdentifier: buildProperties.AppIdentifier }).wait();

		var liveSyncToken = getServer().cordova.getLiveSyncToken(solutionName, projectName).wait();

		buildProperties.LiveSyncToken = liveSyncToken;

		var body = getServer().build.buildProject(solutionName, projectName, {Properties: buildProperties}).wait();

		if (body.Errors.length) {
			log.error("Build errors: %s", body.Errors);
		}

		var buildResults: Server.IPackageDef[] = body.ResultsByTarget.Build.Items.map(function(buildResult) {
			var fullPath = buildResult.FullPath.replace(/\\/g, "/");
			var solutionPath = util.format("%s/%s", projectName, fullPath);

			return {
				platform: buildResult.Platform,
				solution: solutionName,
				solutionPath: solutionPath,
				relativePath: buildResult.FullPath
			};
		});

		return {
			buildResults: buildResults,
			output: body.Output
		};
	}).future<Server.IBuildResult>()();
}

export function downloadFile(solutionName, path, resultPath) {
	log.info("Downloading file '%s/%s' into '%s'", solutionName, path, resultPath);

	//TODO: caching
	var targetFile = fs.createWriteStream(resultPath);

	return getServer().filesystem.getContent(solutionName, path, targetFile);
}

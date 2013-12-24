///<reference path=".d.ts"/>

"use strict";

(function() {
	var querystring = require("querystring"),
		log = require("./log"),
		fs = require("fs"),
		config = require("./config"),
		login = require("./login"),
		cookie = require("cookie"),
		util = require("util"),
		helpers = require("./helpers"),
		Url = require("url");

	function httpRequest(options, callback) {
		var requestProto =  options.proto || "http";
		delete options.proto;
		var body = options.body;
		delete options.body;
		var pipeTo = options.pipeTo;
		delete options.pipeTo;

		var proto = config.PROXY_TO_FIDDLER ? "http" : requestProto;
		var http = require(proto);

		if (config.PROXY_TO_FIDDLER) {
			options.path = requestProto + "://" + options.host + options.path;
			options.headers.Host = options.host;
			options.host = "127.0.0.1";
			options.port = 8888;
		}

		var request = http.request(options, function (response) {
			var data = "";

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
						headers: response.headers,
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
	}

	function authenticate(loginData, callback) {
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

	function basicLogin(userName, password, callback) {
		var loginData = {
			wrap_username: userName,
			wrap_password: password,
		};

		authenticate(loginData, callback);
	}

	function createAuthenticatedRequestParameters(method) {
		return {
			host: config.ICE_SERVER,
			method: method,
			headers : {
				"Cookie": ".ASPXAUTH=" + login.getCookie()
			},

			setSolutionSpace: function(solutionSpace) {
				var self = this;
				if (solutionSpace) {
					self.headers["X-Icenium-SolutionSpace"] = solutionSpace;
				}
			}
		};
	}

	//function callback(error:Error, response:http.Response)
	function importProject(solutionName, projectName, solutionSpace, projectZip, callback) {
		log.info("Importing project %s/%s (%s)", solutionName, projectName, solutionSpace);

		var parameters = createAuthenticatedRequestParameters("POST");
		parameters.path = util.format("/api/projects/importProject/%s/%s", solutionName, projectName);
		parameters.headers["Content-Type"] = "application/octet-stream";
		parameters.headers["Content-Length"] = fs.statSync(projectZip).size;
		parameters.headers["X-Transfer-Mode"] = "Stream";
		parameters.setSolutionSpace(solutionSpace);
		parameters.body = fs.createReadStream(projectZip);

		httpRequest(parameters, function(result) {
			log.debug("Import HTTP status code: %s", result.response.statusCode);

			if (callback) {
				callback(result.error, result.response);
			} else if (result.error) {
				throw result.error;
			}
		});
	}

	function setProjectProperties(solutionName, projectName, solutionSpace, properties, callback) {
		log.debug("Setting project properties of %s/%s (%s):\n%s", solutionName, projectName, solutionSpace, util.inspect(properties));

		var parameters = createAuthenticatedRequestParameters("PATCH");
		parameters.path = util.format("/api/projects/%s/%s", solutionName, projectName);
		parameters.headers["Content-Type"] = "application/json";
		parameters.setSolutionSpace(solutionSpace);
		parameters.body = JSON.stringify(properties);

		httpRequest(parameters, function(result) {
			if (callback) {
				callback(result.error, result.response);
			} else if (result.error) {
				throw result.error;
			}
		});
	}

	function getLiveSyncToken(solutionName, projectName, solutionSpace, callback) {
		log.debug("Getting LiveSync token for %s/%s (%s)", solutionName, projectName, solutionSpace);

		helpers.ensureString(solutionName, 0);
		helpers.ensureString(projectName, 1);
		!solutionSpace || helpers.ensureString(solutionSpace, 2);
		helpers.ensureCallback(callback, 3);

		var parameters = createAuthenticatedRequestParameters("GET");
		parameters.path = util.format("/api/cordova/liveSyncToken/%s/%s", solutionName, projectName);
		parameters.setSolutionSpace(solutionSpace);

		httpRequest(parameters, function(result) {
			callback(result.error, result.error ? null : JSON.parse(result.body));
		});
	}

	function getLiveSyncUrl(urlKind, filesystemPath, liveSyncToken, callback) {
		helpers.ensureString(urlKind, 0);

		urlKind = urlKind.toLowerCase();
		if (urlKind !== "manifest" && urlKind !== "package") {
			throw new Error("urlKind must be either 'manifest' or 'package'");
		}

		var fullDownloadPath = util.format("http://%s/Mist/MobilePackage/%s?packagePath=%s&token=%s",
			config.ICE_SERVER, urlKind,
			querystring.escape(querystring.escape(filesystemPath)),
			querystring.escape(querystring.escape(liveSyncToken)));
		log.debug("Minifying LiveSync URL '%s'", fullDownloadPath);

		var parameters = createAuthenticatedRequestParameters("GET");
		parameters.path = "/api/cordova/liveSyncUrl?longUrl=" + querystring.escape(fullDownloadPath);

		httpRequest(parameters, function(result) {
			if (result.error) {
				callback(result.error);
				return;
			}

			var url = JSON.parse(result.body);
			if (urlKind === "manifest") {
				url = "itms-services://?action=download-manifest&amp;url=" + querystring.escape(url);
			}

			log.debug("Device install URL '%s'", url);
			callback(null, url);
		});
	}

	function buildProject(solutionName, projectName, solutionSpace, buildProperties, callback) {
		log.info("Building project %s/%s (%s)", solutionName, projectName, solutionSpace);

		setProjectProperties(solutionName, projectName, solutionSpace,
			{ AppIdentifier: buildProperties.AppIdentifier },
			function() {
				getLiveSyncToken(solutionName, projectName, solutionSpace, function(err, liveSyncToken) {
					if (err) {
						callback(err);
						return;
					}
					buildProperties.LiveSyncToken = liveSyncToken;

					var parameters = createAuthenticatedRequestParameters("POST");
					parameters.path = util.format("/api/build/%s/%s", solutionName, projectName);
					parameters.setSolutionSpace(solutionSpace);
					parameters.headers["Content-Type"] = "application/json";
					parameters.body = JSON.stringify({Properties: buildProperties});

					httpRequest(parameters, function(result) {
						var error = result.error;

						var body = JSON.parse(result.body);

						if (body.Errors.length) {
							log.error("Build errors: %s", body.Errors);
						}

						var buildResults = body.ResultsByTarget.Build.Items;
						buildResults = buildResults.map(function(buildResult) {
							var fullPath = buildResult.FullPath.replace(/\\/g, "/");
							var downloadUrl = util.format("raw/%s/%s/%s", solutionName, projectName, fullPath);

							return {
								platform: buildResult.Platform,
								filesystemPath: downloadUrl,
								relativePath: buildResult.FullPath
							};
						});

						callback(error, {
							buildResults: buildResults,
							output: body.Output
						});
					});
				});
			}
		);
	}

	function downloadFile(filesystemPath, resultPath, callback) {
		log.info("Downloading file '%s' into '%s'", filesystemPath, resultPath);

		//TODO: caching
		var targetFile = fs.createWriteStream(resultPath);

		var parameters = createAuthenticatedRequestParameters("GET");
		parameters.path = "/api/filesystem/" + filesystemPath;
		parameters.setSolutionSpace(config.SOLUTION_SPACE_NAME);
		parameters.pipeTo = targetFile;
		httpRequest(parameters, function(result) {
			if (callback) {
				callback(result.error, result.response);
			}
		});
	}

	function downloadCordovaPlugins(resultPath, callback) {
		log.info("Downloading Cordova Plugins package into '%s'", resultPath);

		//TODO: caching
		var targetFile = fs.createWriteStream(resultPath);

		var parameters = createAuthenticatedRequestParameters("GET");
		parameters.path = "/api/cordova/plugins/package";
		parameters.pipeTo = targetFile;
		httpRequest(parameters, function(result) {
			if (callback) {
				callback(result.error, result.response);
			}
		});
	}

	function getIdentities(callback) {
		!callback || helpers.ensureCallback(callback, 0);

		var parameters = createAuthenticatedRequestParameters("GET");
		parameters.path = "/api/identityStore/identities";
		httpRequest(parameters, function(result) {
			var error = result.error;
			var data = !error ? JSON.parse(result.body).$values : null;

			if (callback) {
				callback(error, data);
			} else if (error) {
				throw error;
			}
		});
	}

	function getProvisions(callback) {
		!callback || helpers.ensureCallback(callback, 0);

		var parameters = createAuthenticatedRequestParameters("GET");
		parameters.path = "/api/mobileprovisions";

		httpRequest(parameters, function(result) {
			var data = !result.error ? JSON.parse(result.body).$values : null;
			if (callback) {
				callback(result.error, data);
			} else if  (result.error) {
				throw result.error;
			}
		});
	}

	function downloadUrl(url, resultPath, callback) {
		log.debug("Downloading URL '%s' to '%s'", url, resultPath);

		var urlObj = Url.parse(url);

		var targetFile = fs.createWriteStream(resultPath);
		var parameters = {
			host: urlObj.host,
			path: urlObj.path,
			method: "GET",
			pipeTo: targetFile
		};
		httpRequest(parameters, function(result) {
			var response = result.response;
			var error = helpers.isRequestSuccessful(response) ? null : new Error(response.statusCode);
			if (callback) {
				callback(error, response);
			}
		});
	}

	exports.httpRequest = httpRequest;
	exports.createAuthenticatedRequestParameters = createAuthenticatedRequestParameters;
	exports.authenticate = authenticate;
	exports.basicLogin = basicLogin;
	exports.importProject = importProject;
	exports.buildProject = buildProject;
	exports.downloadFile = downloadFile;
	exports.downloadUrl = downloadUrl;
	exports.getIdentities = getIdentities;
	exports.getProvisions = getProvisions;
	exports.getLiveSyncToken = getLiveSyncToken;
	exports.getLiveSyncUrl = getLiveSyncUrl;
	exports.downloadCordovaPlugins = downloadCordovaPlugins;
})();

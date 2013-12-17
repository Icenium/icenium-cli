(function() {
	"use strict";
	var path = require("path"),
		fs = require("fs"),
		exec = require("child_process").exec,
		log = require("./log"),
		request = require("request"),
		unzip = require("unzip"),
		fstream = require("fstream"),
		_ = require("underscore"),
		Q = require("Q"),
		config = require("./config"),
		options = require("./options"),
		util = require("./helpers"),
		server = require("./server"),
		cachedProjectDir = "",
		projectData,
		simulatorPath,
		pluginsPath;

	function getProjectDir() {
		if (cachedProjectDir !== "") {
			return cachedProjectDir;
		}
		cachedProjectDir = null;

		var projectDir = options.path || path.resolve(".");
		while (true) {
			log.trace("Looking for project in '%s'", projectDir);

			if (fs.existsSync(path.join(projectDir, config.PROJECT_FILE_NAME))) {
				log.debug("Project directory is '%s'.", projectDir);
				cachedProjectDir = projectDir;
				break;
			}

			var dir = path.dirname(projectDir);
			if (dir === projectDir) {
				log.info("No project found at or above '%s'.", path.resolve("."));
				break;
			}
			projectDir = dir;
		}

		return cachedProjectDir;
	}

	function getPluginsCommandLine() {
		var res = "";
		projectData.CorePlugins.forEach(function(item) {
			res += item;
			res += ";";
		});
		res = res.slice(0, -1);
		return res;
	}

	function runSimulator() {
		var simulatorBinary = path.join(simulatorPath, "Icenium.Simulator.exe"),
			simulatorParams = '--path "' + getProjectDir() + '" ' +
				'--statusbarstyle "'+ projectData.iOSStatusBarStyle + '" ' +
				'--frameworkversion "' + projectData.FrameworkVersion + '" ' +
				'--orientations "' + projectData.DeviceOrientations + '" ' +
				'--assemblypaths "' + simulatorPath + '" ' +
				'--corepluginspath "' + pluginsPath + '" ' +
				'--plugins "' + getPluginsCommandLine() + '"';

		exec(simulatorBinary + ' ' + simulatorParams);
	}

	function getFromUriPromise(uri, errorMsg) {
		var deferred = Q.defer();

		util.ensureString(uri);
		util.ensureString(errorMsg);

		request.get(uri, function (error, response, body) {
			if (!error && util.isRequestSuccessful(response)) {
				deferred.resolve(body);
			} else {
				deferred.reject(new Error(errorMsg + " Error details: " + error));
			}
		});

		return deferred.promise;
	}

	function versionCompare(version1, version2) {
		util.ensureString(version1);
		util.ensureString(version2);

		var v1array = version1.split("."),
			v2array = version2.split("."),
			v1 = {
				major : parseInt(v1array[0]),
				minor : parseInt(v1array[1]),
				build : parseInt(v1array[2]),
				revision : parseInt(v1array[3])
			},
			v2 = {
				major : parseInt(v2array[0]),
				minor : parseInt(v2array[1]),
				build : parseInt(v2array[2]),
				revision : parseInt(v2array[3])
			};

		if (v1array.length !== 4) {
			throw new Error(version1 + " does not look like a version string");
		}
		if (v2array.length !== 4) {
			throw new Error(version2 + " does not look like a version string");
		}

		if (v1.major !== v2.major) {
			return (v1.major > v2.major) ? 1 : -1;
		} else {
			if (v1.minor !== v2.minor) {
				return (v1.minor > v2.minor) ? 1 : -1;
			} else {
				if (v1.build !== v2.build) {
					return (v1.build > v2.build) ? 1 : -1;
				} else {
					if (v1.revision === v2.revision) {
						return 0;
					}
					if (v1.revision > v2.revision) {
						return 1;
					}
					return -1;
				}
			}
		}
	}

	function getPluginsDirName(serverVersion) {
		var PLUGINS_PACKAGE_IDENTIFIER = "Plugins",
			result;
		if (config.DEBUG) {
			result = PLUGINS_PACKAGE_IDENTIFIER;
		} else {
			result = PLUGINS_PACKAGE_IDENTIFIER + "-" + serverVersion;
		}
		log.debug("PLUGINS dir is: " + result);
		return result;
	}

	function run() {
		// bootstrap - get the server version, check the locally deployed simulator version and if they differ, d/l the server version into a well-known location
		var PACKAGE_NAME = "Telerik.BlackDragon.Client.Mobile.Simulator.Package",
			PLUGINS_API_CONTRACT = "/api/cordova/plugins/package",
			configUri = config.ICE_SERVER_PROTO + "://" + config.ICE_SERVER + "/configuration.json",
			servicesExtensionsUri = config.ICE_SERVER_PROTO + "://" + config.ICE_SERVER + "/services/extensions",
			cacheDir = path.join(process.env.LOCALAPPDATA, "Telerik/BlackDragon/Cache"),
			simulatorVersionFile,
			serverVersion;

		simulatorPath = path.join(cacheDir, PACKAGE_NAME),
		simulatorVersionFile = path.join(simulatorPath, "version.json");

		getFromUriPromise(configUri, "Could not get server configuration.")
		.then(function(body) {
			var config = JSON.parse(body),
				cachedVersion  = "0.0.0.0";

			serverVersion = config.assemblyVersion;

			if (!fs.existsSync(cacheDir)) {
				fs.mkdirSync(cacheDir);
			}
			if (!fs.existsSync(simulatorPath)) {
				fs.mkdirSync(simulatorPath);
			}
			if (fs.existsSync(simulatorVersionFile)) {
				cachedVersion = JSON.parse(fs.readFileSync(simulatorVersionFile)).version;
			}

			if (versionCompare(cachedVersion, serverVersion) === -1) {
				return getFromUriPromise(servicesExtensionsUri, "Could not get server version.")
					.then(function(body) {
						var extensions = JSON.parse(body),
							downloadUri = _.findWhere(extensions["$values"], { Identifier : PACKAGE_NAME }).DownloadUri,
							deferred = Q.defer();

						request.get(downloadUri)
						.on("response", function(response){
							if (util.isRequestSuccessful(response)) {
								response.pipe(unzip.Extract({path: simulatorPath}))
									.on("close", function() {
										// save the version of the downloaded binaries
										var versionJson = JSON.stringify({ version : serverVersion });
										fs.writeFileSync(simulatorVersionFile, versionJson);
										deferred.resolve();
									})
									.on("error", function(err) {
										deferred.reject(err);
									});
							} else {
								deferred.reject(new Error("Server returned status " + response.statusCode));
							}
						})
						.on("error", function(err) {
							deferred.reject(err);
						});
						return deferred.promise;
					});
			}
			return true;
		})
		.then(function() {
			var pluginsApiEndpoint = config.ICE_SERVER_PROTO + "://" + config.ICE_SERVER + PLUGINS_API_CONTRACT,
				deferred = Q.defer();

			pluginsPath = path.join(cacheDir, getPluginsDirName(serverVersion));

			if (!fs.existsSync(pluginsPath)) {
				fs.mkdirSync(pluginsPath);

				Q.nfcall(server.downloadCordovaPlugins, pluginsPath + "/plugins.zip")
					.then(function(response) {
						fs.createReadStream(pluginsPath + "/plugins.zip")
							.pipe(unzip.Extract({path: pluginsPath }))
							.on("close", function() {
								deferred.resolve();
							});
					})
					.catch(function(err) {
						deferred.reject(err);
					});
			} else {
				deferred.resolve();
			}

			return deferred.promise;
		})
		.then(function() {
			runSimulator();
		})
		.done();
	}

	if (getProjectDir()) {
		try {
			projectData = JSON.parse(fs.readFileSync(path.join(getProjectDir(), config.PROJECT_FILE_NAME)));
		} catch(err) {
			log.fatal("There was a problem reading the project file. " + err);
			process.exit(1);
		}
	}

	exports.run = run;
})();

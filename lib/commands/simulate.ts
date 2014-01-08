///<reference path="../.d.ts"/>
"use strict";

import commands = require("./icommand");
import path = require("path");
import fs = require("fs");
import unzip = require("unzip");
import _ = require("underscore");
import Q = require("q");
import config = require("../config");
import options = require("../options");
import util = require("../helpers");
import server = require("../server");

module Commands {
	export class SimulateCommandData implements commands.Commands.ICommandData {
		constructor() {}
	}

	export class SimulateCommandDataFactory implements commands.Commands.ICommandDataFactory {
		public fromCliArguments(args: string[]): SimulateCommandData {
			return new SimulateCommandData();
		}
	}
	global.$injector.register("simulateCommandDataFactory", SimulateCommandDataFactory);

	export class SimulateCommand implements commands.Commands.ICommand<SimulateCommandData> {
		private PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";
		private PACKAGE_NAME: string = "Telerik.BlackDragon.Client.Mobile.Simulator.Package";
		private PLUGINS_API_CONTRACT: string = "/api/cordova/plugins/package";

		private exec = require("child_process").exec;
		private request = require("request");
		private fstream = require("fstream");
		private cachedProjectDir = "";
		private projectData;
		private simulatorPath;
		private pluginsPath;

		constructor(private simulateCommandDataFactory: SimulateCommandDataFactory,
			private log: Interfaces.ILogger) {
			if (this.getProjectDir()) {
				try {
					this.projectData = JSON.parse(fs.readFileSync(path.join(this.getProjectDir(), config.PROJECT_FILE_NAME)).toString());
				} catch(err) {
					this.log.fatal("There was a problem reading the project file. " + err);
					process.exit(1);
				}
			}
		}

		public getDataFactory(): SimulateCommandDataFactory {
			return this.simulateCommandDataFactory;
		}

		public canExecute(data: SimulateCommandData): boolean {
			return true;
		}

		public execute(data: SimulateCommandData): void {
			this.run();
		}

		private getProjectDir() {
			if (this.cachedProjectDir !== "") {
				return this.cachedProjectDir;
			}
			this.cachedProjectDir = null;

			var projectDir = options.path || path.resolve(".");
			while (true) {
				this.log.trace("Looking for project in '%s'", projectDir);

				if (fs.existsSync(path.join(projectDir, config.PROJECT_FILE_NAME))) {
					this.log.debug("Project directory is '%s'.", projectDir);
					this.cachedProjectDir = projectDir;
					break;
				}

				var dir = path.dirname(projectDir);
				if (dir === projectDir) {
					this.log.info("No project found at or above '%s'.", path.resolve("."));
					break;
				}
				projectDir = dir;
			}

			return this.cachedProjectDir;
		}

		private run() {
			// bootstrap - get the server version, check the locally deployed simulator version and if they differ, d/l the server version into a well-known location
			var configUri = config.ICE_SERVER_PROTO + "://" + config.ICE_SERVER + "/configuration.json",
				servicesExtensionsUri = config.ICE_SERVER_PROTO + "://" + config.ICE_SERVER + "/services/extensions",
				cacheDir = path.join(process.env.LOCALAPPDATA, "Telerik/BlackDragon/Cache"),
				simulatorVersionFile,
				serverVersion;

			this.simulatorPath = path.join(cacheDir, this.PACKAGE_NAME),
				simulatorVersionFile = path.join(this.simulatorPath, "version.json");

			this.getFromUriPromise(configUri, "Could not get server configuration.")
				.then((body: string): any => {
					var config = JSON.parse(body),
						cachedVersion  = "0.0.0.0";

					serverVersion = config.assemblyVersion;

					if (!fs.existsSync(cacheDir)) {
						fs.mkdirSync(cacheDir);
					}
					if (!fs.existsSync(this.simulatorPath)) {
						fs.mkdirSync(this.simulatorPath);
					}
					if (fs.existsSync(simulatorVersionFile)) {
						cachedVersion = JSON.parse(fs.readFileSync(simulatorVersionFile).toString()).version;
					}

					if (this.versionCompare(cachedVersion, serverVersion) === -1) {
						return this.getFromUriPromise(servicesExtensionsUri, "Could not get server version.")
							.then((body: string) => {
								var extensions = JSON.parse(body),
									downloadUri = (<any>_.findWhere(extensions["$values"], { Identifier : this.PACKAGE_NAME })).DownloadUri,
									deferred = Q.defer();

								this.request.get(downloadUri)
									.on("response", (response) => {
										if (util.isRequestSuccessful(response)) {
											response.pipe(unzip.Extract({path: this.simulatorPath}))
												.on("close", () => {
													// save the version of the downloaded binaries
													var versionJson = JSON.stringify({ version : serverVersion });
													fs.writeFileSync(simulatorVersionFile, versionJson);
													deferred.resolve();
												})
												.on("error", (err) => {
													deferred.reject(err);
												});
										} else {
											deferred.reject(new Error("Server returned status " + response.statusCode));
										}
									})
									.on("error", (err) => {
										deferred.reject(err);
									});
								return deferred.promise;
							});
					}
					return true;
				})
				.then(() => {
					var pluginsApiEndpoint = config.ICE_SERVER_PROTO + "://" + config.ICE_SERVER + this.PLUGINS_API_CONTRACT,
						deferred = Q.defer();

					this.pluginsPath = path.join(cacheDir, this.getPluginsDirName(serverVersion));

					if (!fs.existsSync(this.pluginsPath)) {
						fs.mkdirSync(this.pluginsPath);

						Q.nfcall(server.downloadCordovaPlugins, this.pluginsPath + "/plugins.zip")
							.then((response) => {
								fs.createReadStream(this.pluginsPath + "/plugins.zip")
									.pipe(unzip.Extract({path: this.pluginsPath }))
									.on("close", () => {
										deferred.resolve();
									});
							})
							.catch((err) => {
								deferred.reject(err);
							});
					} else {
						deferred.resolve();
					}

					return deferred.promise;
				})
				.then(() => {
					this.runSimulator();
				})
				.done();
		}

		private runSimulator() {
			var simulatorBinary = path.join(this.simulatorPath, "Icenium.Simulator.exe"),
				simulatorParams = '--path "' + this.getProjectDir() + '" ' +
					'--statusbarstyle "'+ this.projectData.iOSStatusBarStyle + '" ' +
					'--frameworkversion "' + this.projectData.FrameworkVersion + '" ' +
					'--orientations "' + this.projectData.DeviceOrientations + '" ' +
					'--assemblypaths "' + this.simulatorPath + '" ' +
					'--corepluginspath "' + this.pluginsPath + '" ' +
					'--plugins "' + this.getPluginsCommandLine() + '"';

			this.exec(simulatorBinary + ' ' + simulatorParams);
		}

		private getPluginsCommandLine() {
			var res = "";
			this.projectData.CorePlugins.forEach((item) => {
				res += item;
				res += ";";
			});
			res = res.slice(0, -1);
			return res;
		}

		private getFromUriPromise(uri, errorMsg): Q.Promise<string> {
			var deferred = Q.defer<string>();

			util.ensureString(uri);
			util.ensureString(errorMsg);

			this.request.get(uri, (error, response, body) => {
				if (!error && util.isRequestSuccessful(response)) {
					deferred.resolve(body);
				} else {
					deferred.reject(new Error(errorMsg + " Error details: " + error));
				}
			});

			return deferred.promise;
		}

		private versionCompare(version1, version2) {
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

		private getPluginsDirName(serverVersion) {
			var result;
			if (config.DEBUG) {
				result = this.PLUGINS_PACKAGE_IDENTIFIER;
			} else {
				result = this.PLUGINS_PACKAGE_IDENTIFIER + "-" + serverVersion;
			}
			this.log.debug("PLUGINS dir is: " + result);
			return result;
		}
	}
	global.$injector.register("simulate", Commands.SimulateCommand);
}

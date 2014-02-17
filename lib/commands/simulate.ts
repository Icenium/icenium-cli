///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import unzip = require("unzip");
import options = require("../options");
import util = require("../helpers");
import Future = require("fibers/future");
import child_process = require("child_process");
var _ = <UnderscoreStatic> require("underscore");

export class SimulateCommand implements ICommand {
	private PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";
	private PACKAGE_NAME: string = "Telerik.BlackDragon.Client.Mobile.Simulator.Package";
	private PLUGINS_API_CONTRACT: string = "/api/cordova/plugins/package";

	private projectData;
	private cacheDir: string;
	private simulatorPath: string;
	private pluginsPath: string;
	private serverVersion: string;

	constructor(private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		private $fs: IFileSystem,
		private $config: IConfiguration,
		private $serverConfiguration: IServerConfiguration,
		private $server: Server.IServer,
		private $project: Project.IProject,
		private $loginManager: ILoginManager) {
		this.projectData = $project.projectData;
	}

	public execute(args: string[]): void {
		(() => {
			this.cacheDir = path.join(options["profile-dir"], "Cache");
			this.serverVersion = this.$serverConfiguration.assemblyVersion.wait();
			this.$logger.debug("Server version: %s", this.serverVersion);

			this.$loginManager.ensureLoggedIn().wait();

			this.prepareSimulator().wait();
			this.prepareCordovaPlugins().wait();

			this.runSimulator();
		}).future<void>()().wait();
	}

	private prepareSimulator(): IFuture<void> {
		return ((): void => {
			this.simulatorPath = path.join(this.cacheDir, this.PACKAGE_NAME);
			this.$fs.createDirectory(this.simulatorPath).wait();

			var servicesExtensionsUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + "/services/extensions";
			var serverVersionFile = path.join(this.cacheDir, "server-version.json");

			this.$logger.trace("Simulator path: %s", this.simulatorPath);

			var cachedVersion  = "0.0.0.0";

			if (this.$fs.exists(serverVersionFile).wait()) {
				cachedVersion = this.$fs.readJson(serverVersionFile).wait().version;
				this.$logger.debug("Cached version is: %s", cachedVersion);
			}

			if (this.versionCompare(cachedVersion, this.serverVersion) < 0) {
				this.$logger.trace("Getting extensions from %s", servicesExtensionsUri);
				var extensions = JSON.parse(this.$httpClient.httpRequest(servicesExtensionsUri).wait().body),
					downloadUri = (<any>_.findWhere(extensions["$values"], { Identifier : this.PACKAGE_NAME })).DownloadUri;

				this.$logger.info("Updating simulator package...");
				this.$logger.debug("Downloading simulator from %s", downloadUri);

				var extractor = unzip.Extract({path: this.simulatorPath});
				this.$httpClient.httpRequest({
					url: downloadUri,
					pipeTo: extractor
				});

				this.$fs.futureFromEvent(extractor, "finish").wait();

				this.$fs.writeJson(serverVersionFile, { version : this.serverVersion }).wait();

				this.$logger.info("Finished updating simulator package.");
			}
		}).future<void>()();
	}

	private prepareCordovaPlugins(): IFuture<void> {
		return (() => {
			this.pluginsPath = path.join(this.cacheDir, this.getPluginsDirName(this.serverVersion));

			var pluginsApiEndpoint = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + this.PLUGINS_API_CONTRACT;

			if (!this.$fs.exists(this.pluginsPath).wait()) {
				this.$logger.info("Downloading core Cordova plugins...");

				this.$fs.createDirectory(this.pluginsPath).wait();
				var zipPath = path.join(this.pluginsPath, "plugins.zip");

				this.$logger.debug("Downloading Cordova plugins package into '%s'", zipPath);
				var zipFile = this.$fs.createWriteStream(zipPath);
				this.$server.cordova.getPluginsPackage(zipFile).wait();

				this.$logger.debug("Unpacking Cordova plugins from %s", zipPath);
				var unzipPlugins = this.$fs.createReadStream(zipPath).pipe(unzip.Extract({path: this.pluginsPath }));
				this.$fs.futureFromEvent(unzipPlugins, "close").wait();

				this.$logger.info("Finished downloading plugins.");
			}
		}).future<void>()();
	}

	private runSimulator() {
		this.$logger.info("Starting simulator...");

		var simulatorBinary = path.join(this.simulatorPath, "Icenium.Simulator.exe");
		var simulatorParams = [
			"--path", this.$project.getProjectDir(),
			"--statusbarstyle", this.projectData.iOSStatusBarStyle,
			"--frameworkversion", this.projectData.FrameworkVersion,
			"--orientations", this.projectData.DeviceOrientations.join(";"),
			"--assemblypaths", this.simulatorPath,
			"--corepluginspath", this.pluginsPath,
			"--plugins", this.projectData.CorePlugins.join(";")
			];

		var commandLine = simulatorBinary + ' ' + simulatorParams.join(' ');
		this.$logger.trace(commandLine);
		var childProcess = child_process.spawn(simulatorBinary, simulatorParams,
			{ stdio:  ["ignore", "ignore", "ignore"], detached: true });
		childProcess.unref();
	}

	private versionCompare(version1: string, version2: string) {
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
		if (this.$config.DEBUG) {
			result = this.PLUGINS_PACKAGE_IDENTIFIER;
		} else {
			result = this.PLUGINS_PACKAGE_IDENTIFIER + "-" + serverVersion;
		}
		this.$logger.debug("PLUGINS dir is: " + result);
		return result;
	}
}
$injector.registerCommand("simulate", SimulateCommand);

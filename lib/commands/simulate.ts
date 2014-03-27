///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import unzip = require("unzip");
import options = require("../options");
import util = require("../helpers");
import Future = require("fibers/future");

export class SimulateCommand implements ICommand {
	private PLUGINS_PACKAGE_IDENTIFIER: string = "Plugins";
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
		private $loginManager: ILoginManager,
		private $platformServices: ISimulatorPlatformServices) {
		this.projectData = $project.projectData;
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			this.cacheDir = path.join(options["profile-dir"], "Cache");
			this.serverVersion = this.$serverConfiguration.assemblyVersion.wait();
			this.$logger.debug("Server version: %s", this.serverVersion);

			this.$loginManager.ensureLoggedIn().wait();

			this.prepareSimulator().wait();
			this.prepareCordovaPlugins().wait();

			this.runSimulator();
		}).future<void>()();
	}

	private prepareSimulator(): IFuture<void> {
		return ((): void => {
			this.simulatorPath = path.join(this.cacheDir, this.$platformServices.getPackageName());
			this.$fs.createDirectory(this.simulatorPath).wait();

			var serverVersionFile = path.join(this.cacheDir, "server-version.json");

			this.$logger.trace("Simulator path: %s", this.simulatorPath);

			var cachedVersion  = "0.0.0.0";

			if (this.$fs.exists(serverVersionFile).wait()) {
				cachedVersion = this.$fs.readJson(serverVersionFile).wait().version;
				this.$logger.debug("Cached version is: %s", cachedVersion);
			}

			if (this.versionCompare(cachedVersion, this.serverVersion) < 0) {
				var downloadUri = this.getSimulatorDownloadUri().wait();
				this.$logger.info("Updating simulator package...");
				this.$logger.debug("Downloading simulator from %s", downloadUri);

				var extractor = unzip.Extract({path: this.simulatorPath});
				var request = this.$httpClient.httpRequest({
					url: downloadUri,
					pipeTo: extractor,
					headers: { Accept: "application/octet-stream, application/x-silverlight-app" }
				});

				this.$fs.futureFromEvent(extractor, "close").wait();
				request.wait();

				this.$platformServices.preparePackage(this.simulatorPath);

				this.$fs.writeJson(serverVersionFile, { version : this.serverVersion }).wait();

				this.$logger.info("Finished updating simulator package.");
			}
		}).future<void>()();
	}

	private getSimulatorDownloadUri(): IFuture<string> {
		return (() => {
			var serverUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER;
			var downloadUri: string;

			if (this.$config.USE_CDN_FOR_SIMULATOR_DOWNLOAD) {
				var servicesExtensionsUri =  serverUri + "/services/extensions";

				this.$logger.trace("Getting extensions from %s", servicesExtensionsUri);

				var extensions = JSON.parse(this.$httpClient.httpRequest(servicesExtensionsUri).wait().body);
				downloadUri = (<any>_.findWhere(extensions["$values"],
						{ Identifier : this.$platformServices.getPackageName() })).DownloadUri;
			} else {
				downloadUri = serverUri + "/ClientBin/" + this.$platformServices.getPackageName() + '.xap';
			}

			return downloadUri;
		}).future<string>()();
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

		var simulatorParams = [
			"--path", this.$project.getProjectDir(),
			"--statusbarstyle", this.projectData.iOSStatusBarStyle,
			"--frameworkversion", this.projectData.FrameworkVersion,
			"--orientations", this.projectData.DeviceOrientations.join(";"),
			"--assemblypaths", this.simulatorPath,
			"--corepluginspath", this.pluginsPath,
			"--plugins", this.projectData.CorePlugins.join(";")
			];

		this.$platformServices.runSimulator(this.simulatorPath, simulatorParams);
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

class WinSimulatorPlatformServices implements ISimulatorPlatformServices {
    private PACKAGE_NAME_WIN: string = "Telerik.BlackDragon.Client.Mobile.Simulator.Package";
    private EXECUTABLE_NAME_WIN = "Icenium.Simulator.exe";

    constructor(private $childProcess: IChildProcess) {
    }

    public getPackageName() : string {
        return this.PACKAGE_NAME_WIN;
    }

    public preparePackage(simulatorPath: string): void {
        // nothing to do on Windows platform
    }

    public runSimulator(simulatorPath: string, simulatorParams: string[]) {
        var simulatorBinary = path.join(simulatorPath, this.EXECUTABLE_NAME_WIN);
        var childProcess = this.$childProcess.spawn(simulatorBinary, simulatorParams,
            { stdio:  ["ignore", "ignore", "ignore"], detached: true });
        childProcess.unref();
    }
}

class MacSimulatorPlatformServices implements ISimulatorPlatformServices {
    private PACKAGE_NAME_MAC: string = "Telerik.BlackDragon.Client.Mobile.Simulator.Mac.Package";
    private EXECUTABLE_NAME_MAC = "Icenium.Simulator.app";

    constructor(private $fs: IFileSystem,
				private $childProcess: IChildProcess) {
    }

    public getPackageName() : string {
        return this.PACKAGE_NAME_MAC;
    }

    // Ugly hack: our build does not package the mac binary file with executable bit set.
    // we must set it before attempting to start the app bundle
    // this code should be removed after we change our build
    public preparePackage(simulatorPath: string): void {
        var macExecutablePath = path.join(simulatorPath, "/Icenium.Simulator.app/Contents/MacOS/Icenium.Simulator");
        this.$fs.chmod(macExecutablePath, 0x755).wait();
    }

    public runSimulator(simulatorPath: string, simulatorParams: string[]) {
        var simulatorBinary = path.join(simulatorPath, this.EXECUTABLE_NAME_MAC);
        var commandLine = ['-W', simulatorBinary, '--args'].concat(simulatorParams);
        var childProcess = this.$childProcess.spawn('open', commandLine,
            { stdio:  ["ignore", "ignore", "ignore"], detached: true });
        childProcess.unref();
    }
}

if (util.isWindows()) {
    $injector.register("platformServices", WinSimulatorPlatformServices);
} else if (util.isDarwin()) {
    $injector.register("platformServices", MacSimulatorPlatformServices);
}

///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import options = require("../options");
import Future = require("fibers/future");
import helpers = require("../helpers");

export class ServerExtensionsService implements IServerExtensionsService{
	private extensionVersions = {};

	constructor(private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		private $fs: IFileSystem,
		private $config: IConfiguration,
		private $serverConfiguration: IServerConfiguration,
		private $server: Server.IServer) {
			if (this.$fs.exists(this.versionsFile).wait()) {
				this.extensionVersions = this.$fs.readJson(this.versionsFile).wait();
			}
	}

	public get cacheDir(): string {
		return path.join(options["profile-dir"], "Cache");
	}

	public getExtensionVersion(packageName: string): string {
		return this.extensionVersions[packageName];
	}

	public getExtensionPath(packageName: string): string {
		return path.join(this.cacheDir, packageName);
	}

	public prepareExtension(packageName: string): IFuture<void> {
		return ((): void => {
			var extensionPath = this.getExtensionPath(packageName);
			this.$fs.createDirectory(extensionPath).wait();
			this.$logger.trace("Extension path for %s: %s", packageName, extensionPath);

			var cachedVersion = "0.0.0.0";
			var serverVersion = this.$serverConfiguration.assemblyVersion.wait();
			this.$logger.debug("Server version: %s", serverVersion);
			
			if (this.extensionVersions[packageName]) {
				cachedVersion = this.extensionVersions[packageName];
				this.$logger.debug("Cached version is: %s", cachedVersion);
			}

			if (helpers.versionCompare(cachedVersion, serverVersion) < 0) {
				this.$logger.info("Updating %s package...", packageName);
				var zipFileName = path.join(this.cacheDir, packageName + ".zip");
				this.downloadPackage(packageName, zipFileName).wait();
				this.$fs.unzip(zipFileName, extensionPath).wait();
				this.$fs.deleteFile(zipFileName).wait();
				this.extensionVersions[packageName] = serverVersion;
				this.saveVersionsFile().wait();
				this.$logger.info("Finished updating %s package.", packageName);
			}
		}).future<void>()();
	}

	private get versionsFile(): string {
		return path.join(this.cacheDir, "extension-versions.json");
	}

	private saveVersionsFile() : IFuture<void>{
		return this.$fs.writeJson(this.versionsFile, this.extensionVersions);
	}

	private downloadPackage(packageName:string, zipFileName: string): IFuture<void> {
		return ((): void => {
			var downloadUri = this.getExtensionDownloadUri(packageName).wait();
			this.$logger.debug("Downloading package from %s", downloadUri);

			var zipFile = this.$fs.createWriteStream(zipFileName);
			var request = this.$httpClient.httpRequest({
				url: downloadUri,
				pipeTo: zipFile,
				headers: { Accept: "application/octet-stream, application/x-silverlight-app" }
			});

			this.$fs.futureFromEvent(zipFile, "finish").wait();
			request.wait();
		}).future<void >()();
	}

	private getExtensionDownloadUri(packageName: string): IFuture<string> {
		return (() => {
			var serverUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER;
			var downloadUri: string;

			if (this.$config.USE_CDN_FOR_EXTENSION_DOWNLOAD) {
				var servicesExtensionsUri = serverUri + "/services/extensions";

				this.$logger.trace("Getting extensions from %s", servicesExtensionsUri);

				var extensions = JSON.parse(this.$httpClient.httpRequest(servicesExtensionsUri).wait().body);
				downloadUri = (<any>_.findWhere(extensions["$values"],
					{ Identifier: packageName })).DownloadUri;
			} else {
				downloadUri = serverUri + "/ClientBin/" + packageName + '.xap';
			}

			return downloadUri;
		}).future<string>()();
	}
}
$injector.register("serverExtensionsService", ServerExtensionsService);
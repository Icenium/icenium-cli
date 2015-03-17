///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import options = require("../common/options");
import helpers = require("../helpers");

export class ExtensionsServiceBase {
	private extensionVersions: IStringDictionary = {};

	constructor(public $fs: IFileSystem,
				public $httpClient: Server.IHttpClient,
				public $logger: ILogger) {
		if (this.$fs.exists(this.versionsFile).wait()) {
			this.extensionVersions = this.$fs.readJson(this.versionsFile).wait() || {};
		}
	}

	public get cacheDir(): string {
		return path.join(options.profileDir, "Cache");
	}

	public getExtensionVersion(packageName: string): string {
		return this.extensionVersions[packageName];
	}

	public getExtensionPath(packageName: string): string {
		return path.join(this.cacheDir, packageName);
	}

	public prepareExtensionBase(extensionData: IExtensionData, initialCachedVersion: string, beforeDownloadAction?: () => IFuture<void>): IFuture<void> {
		return ((): void => {
			var packageName = extensionData.packageName;
			var extensionVersion = extensionData.version;
			var extensionPath = extensionData.pathToSave || this.getExtensionPath(extensionData.packageName);

			var cachedVersion = initialCachedVersion;
			this.$logger.debug("Server version: %s", extensionVersion);

			if (this.extensionVersions[packageName]) {
				cachedVersion = this.extensionVersions[packageName];
				this.$logger.debug("Cached version is: %s", cachedVersion);
			}

			if( helpers.versionCompare(cachedVersion, extensionVersion) < 0) {
				this.$logger.info("Updating %s package...", packageName);
				var zipFileName = path.join(this.cacheDir, packageName + ".zip");

				if(beforeDownloadAction) {
					beforeDownloadAction().wait();
				}

				if(this.$fs.exists(extensionPath).wait()) {
					this.$fs.deleteDirectory(extensionPath).wait();
				}

				this.$fs.createDirectory(extensionPath).wait();
				this.$logger.trace("Extension path for %s: %s", packageName, extensionPath);

				try {
					this.downloadPackage(extensionData.downloadUri, zipFileName).wait();
					this.$fs.unzip(zipFileName, extensionPath).wait();
					this.$fs.deleteFile(zipFileName).wait();
					this.extensionVersions[packageName] = extensionVersion;
					this.saveVersionsFile().wait();
				} catch(err) {
					this.$fs.deleteDirectory(extensionPath).wait();
					throw err;
				}
				this.$logger.info("Finished updating %s package.", packageName);
			}
		}).future<void>()();
	}

	private get versionsFile(): string {
		return path.join(this.cacheDir, "extension-versions.json");
	}

	private saveVersionsFile() : IFuture<void> {
		return this.$fs.writeJson(this.versionsFile, this.extensionVersions);
	}

	private downloadPackage(downloadUri: string, zipFileName: string): IFuture<void> {
		return ((): void => {
			this.$logger.debug("Downloading package from %s", downloadUri);

			var zipFile = this.$fs.createWriteStream(zipFileName);
			var request = this.$httpClient.httpRequest({
				url: downloadUri,
				pipeTo: zipFile,
				headers: { Accept: "application/octet-stream, application/x-silverlight-app" }
			});

			request.wait();
		}).future<void >()();
	}
}
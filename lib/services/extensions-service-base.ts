///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import options = require("../common/options");
import helpers = require("../helpers");
import temp = require("temp");
import util = require("util");
temp.track();

export class ExtensionsServiceBase {
	private extensionVersions: IStringDictionary = {};

	constructor(public cacheDir: string,
		protected $fs: IFileSystem,
		protected $httpClient: Server.IHttpClient,
		protected $logger: ILogger) {
		if (this.$fs.exists(this.versionsFile).wait()) {
			this.extensionVersions = this.$fs.readJson(this.versionsFile).wait() || {};
		}
	}

	public getExtensionVersion(packageName: string): string {
		if(!this.extensionVersions) {
			return null;
		}
		return this.extensionVersions[packageName];
	}

	public getExtensionPath(packageName: string): string {
		return path.join(this.cacheDir, packageName);
	}

	public prepareExtensionBase(extensionData: IExtensionData, initialCachedVersion: string, actions?: { beforeDownloadAction?: () => IFuture<void>; afterDownloadAction?: () => IFuture<void>}): IFuture<void> {
		return ((): void => {
			actions = actions || {};

			if (this.$fs.exists(this.versionsFile).wait()) {
				this.extensionVersions = this.$fs.readJson(this.versionsFile).wait() || {};
			}

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
				this.$logger.printInfoMessageOnSameLine(util.format("Updating %s package...", packageName));
				var zipFileName = temp.path({ path:  path.join(this.cacheDir, packageName + ".zip") });

				if(actions.beforeDownloadAction) {
					actions.beforeDownloadAction().wait();
				}

				this.$fs.deleteDirectory(extensionPath).wait();

				this.$fs.createDirectory(extensionPath).wait();
				this.$logger.trace("Extension path for %s: %s", packageName, extensionPath);

				try {
					this.downloadPackage(extensionData.downloadUri, zipFileName).wait();
					this.$fs.unzip(zipFileName, extensionPath).wait();
					this.$fs.deleteFile(zipFileName).wait();
					this.extensionVersions[packageName] = extensionVersion;
					if(actions.afterDownloadAction) {
						actions.afterDownloadAction().wait();
					}
					this.saveVersionsFile().wait();
				} catch(err) {
					this.$fs.deleteDirectory(extensionPath).wait();
					throw err;
				}
				this.$logger.trace("Finished updating %s package.", packageName);
			}
		}).future<void>()();
	}

	public shouldUpdatePackage(cachedVersion: string, extensionVersion: string): boolean {
		return helpers.versionCompare(cachedVersion, extensionVersion) < 0;
	}

	private get versionsFile(): string {
		return path.join(options.profileDir, "Cache", "extension-versions.json");
	}

	private saveVersionsFile() : IFuture<void> {
		return this.$fs.writeJson(this.versionsFile, this.extensionVersions);
	}

	private downloadPackage(downloadUri: string, zipFileName: string): IFuture<Server.IResponse> {
		this.$logger.debug("Downloading package from %s", downloadUri);

		var zipFile = this.$fs.createWriteStream(zipFileName);
		var request = this.$httpClient.httpRequest({
			url: downloadUri,
			pipeTo: zipFile,
			headers: { Accept: "application/octet-stream, application/x-silverlight-app" }
		});

		return request;
	}
}
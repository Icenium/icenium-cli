///<reference path="../.d.ts"/>
"use strict";

import * as path from "path";
import * as helpers from "../helpers";

export class ExtensionsServiceBase {
	private extensionVersions: IStringDictionary = {};

	constructor(public cacheDir: string,
		protected $fs: IFileSystem,
		protected $httpClient: Server.IHttpClient,
		protected $logger: ILogger,
		protected $options: IOptions) {
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

			let packageName = extensionData.packageName;
			let extensionVersion = extensionData.version;
			let extensionPath = extensionData.pathToSave || this.getExtensionPath(extensionData.packageName);

			let cachedVersion = initialCachedVersion;
			this.$logger.debug("Server version: %s", extensionVersion);

			if (this.extensionVersions[packageName]) {
				cachedVersion = this.extensionVersions[packageName];
				this.$logger.debug("Cached version is: %s", cachedVersion);
			}

			if( this.shouldUpdatePackage(cachedVersion, extensionVersion) ) {
				this.$logger.printInfoMessageOnSameLine(`Updating ${packageName} package...`);
				let zipFileName = path.join(this.cacheDir, packageName + ".zip");

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
					this.$fs.deleteFile(zipFileName);
					this.$fs.deleteDirectory(extensionPath).wait();
					throw err;
				}
				this.$logger.trace("Finished updating %s package.", packageName);
			}
		}).future<void>()();
	}

	public shouldUpdatePackage(cachedVersion: string, extensionVersion: string): boolean {
		return helpers.versionCompare(cachedVersion, extensionVersion) !== 0;
	}

	private get versionsFile(): string {
		return path.join(this.$options.profileDir, "Cache", "extension-versions.json");
	}

	private saveVersionsFile() : IFuture<void> {
		return this.$fs.writeJson(this.versionsFile, this.extensionVersions);
	}

	private downloadPackage(downloadUri: string, zipFileName: string): IFuture<Server.IResponse> {
		this.$logger.debug("Downloading package from %s", downloadUri);

		let zipFile = this.$fs.createWriteStream(zipFileName);
		let request = this.$httpClient.httpRequest({
			url: downloadUri,
			pipeTo: zipFile,
			headers: { Accept: "application/octet-stream, application/x-silverlight-app" }
		});

		return request;
	}
}

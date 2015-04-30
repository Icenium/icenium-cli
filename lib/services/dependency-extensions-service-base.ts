///<reference path="../.d.ts"/>
"use strict";
import os = require("os");
import path = require("path");
import serverExtensionsBaseLib = require("./extensions-service-base");
import util = require("util");

export class DependencyExtensionsServiceBase extends serverExtensionsBaseLib.ExtensionsServiceBase implements IDependencyExtensionsServiceBase {
	private static SCREEN_BUILDER_BUCKET_NAME = "http://s3.amazonaws.com/screenbuilder-cli";
	private static DEFAULT_CACHED_VERSION = "0.0.0";

	constructor(public cacheDir: string,
		$fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$options: IOptions,
		private $progressIndicator: IProgressIndicator) {
		super(cacheDir, $fs, $httpClient, $logger, $options);
	}

	public prepareDependencyExtension(dependencyExtensionName: string, dependencyConfig: IDependencyConfig, afterPrepareAction?: () => IFuture<void>): IFuture<void> {
		return (() => {
			let extensionVersion = this.getExtensionVersion(dependencyExtensionName);
			let cachedVersion = extensionVersion || DependencyExtensionsServiceBase.DEFAULT_CACHED_VERSION;
			let downloadUrl = util.format("%s/v%s/%s.zip", DependencyExtensionsServiceBase.SCREEN_BUILDER_BUCKET_NAME, dependencyConfig.version, dependencyExtensionName);

			this.$logger.trace("prepareDependencyExtension: Download url: %s, cached version", downloadUrl, cachedVersion);

			if (this.shouldUpdatePackage(cachedVersion, dependencyConfig.version)) {
				this.$logger.out("Preparing %s", dependencyExtensionName);

				let dependencyExtensionData = {
					packageName: dependencyExtensionName,
					version: dependencyConfig.version,
					downloadUri: downloadUrl,
					pathToSave: dependencyConfig.pathToSave
				};

				this.$progressIndicator.showProgressIndicator(this.prepareExtensionBase(dependencyExtensionData, cachedVersion, {afterDownloadAction: () => this.$progressIndicator.showProgressIndicator(afterPrepareAction(), 100)}), 5000).wait();
				this.$logger.printInfoMessageOnSameLine(os.EOL);
			}
		}).future<void>()();
	}
}
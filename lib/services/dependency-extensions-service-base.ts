///<reference path="../.d.ts"/>
"use strict";
import path = require("path");
import serverExtensionsBaseLib = require("./extensions-service-base");
import util = require("util");

export class DependencyExtensionsServiceBase extends serverExtensionsBaseLib.ExtensionsServiceBase implements IDependencyExtensionsServiceBase {
	private static SCREEN_BUILDER_BUCKET_NAME = "http://s3.amazonaws.com/screenbuilder-cli";

	constructor($fs: IFileSystem,
				$httpClient: Server.IHttpClient,
				$logger: ILogger) {
		super($fs, $httpClient, $logger);
	}

	public prepareDependencyExtension(dependencyExtensionName: string, dependencyConfig: IDependencyConfig): IFuture<void> {
		return (() => {
			var cachedVersion = this.$fs.exists(path.join(this.getExtensionPath(dependencyExtensionName), dependencyExtensionName)).wait() ? dependencyConfig.version : "0.0.0";
			var downloadUrl = util.format("%s/v%s/%s.zip", DependencyExtensionsServiceBase.SCREEN_BUILDER_BUCKET_NAME, dependencyConfig.version, dependencyExtensionName);
			this.$logger.trace("Download url: %s", downloadUrl);

			var dependencyExtensionData = {
				packageName: dependencyExtensionName,
				version: dependencyConfig.version,
				downloadUri: downloadUrl,
				pathToSave: dependencyConfig.pathToSave
			};

			this.prepareExtensionBase(dependencyExtensionData, cachedVersion).wait();
		}).future<void>()();
	}
}
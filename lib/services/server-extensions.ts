///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");

import serverExtensionsBaseLib = require("./extensions-service-base");

export class ServerExtensionsService extends serverExtensionsBaseLib.ExtensionsServiceBase implements IServerExtensionsService {
	constructor($logger: ILogger,
		$httpClient: Server.IHttpClient,
		$fs: IFileSystem,
		private $config: IConfiguration,
		private $serverConfiguration: IServerConfiguration){
			super($fs, $httpClient, $logger);
	}

	public prepareExtension(packageName: string, beforeDownloadExtensionAction: () => IFuture<void>): IFuture<void> {
		return (() => {
			var cachedVersion = "0.0.0.0";
			var extensionData = {
				packageName: packageName,
				version: this.$serverConfiguration.assemblyVersion.wait(),
				downloadUri: this.getExtensionDownloadUri(packageName).wait()
			};

			this.prepareExtensionBase(extensionData, cachedVersion, beforeDownloadExtensionAction).wait();
		}).future<void>()();
	}

	private getExtensionDownloadUri(packageName: string): IFuture<string> {
		return (() => {
			var serverUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER;
			var downloadUri: string;

			if (this.$config.USE_CDN_FOR_EXTENSION_DOWNLOAD) {
				var servicesExtensionsUri = serverUri + "/appbuilder/services/extensions";

				this.$logger.trace("Getting extensions from %s", servicesExtensionsUri);

				var extensions = JSON.parse(this.$httpClient.httpRequest(servicesExtensionsUri).wait().body);
				downloadUri = (<any>_.findWhere(extensions["$values"],
					{ Identifier: packageName })).DownloadUri;
			} else {
				downloadUri = serverUri + "/appbuilder/ClientBin/" + packageName + '.xap';
			}

			return downloadUri;
		}).future<string>()();
	}
}
$injector.register("serverExtensionsService", ServerExtensionsService);
///<reference path="../.d.ts"/>

"use strict";

import Future = require("fibers/future");

export class PostInstallCommand implements ICommand {
	constructor(private $templatesService: ITemplatesService,
		private $resourceDownloader: IResourceDownloader,
		private $cordovaMigrationService: ICordovaMigrationService,
		private $logger: ILogger,
		private $serviceProxy: Server.IServiceProxy) { }

	public disableAnalytics = true;

	public execute(args:string[]): IFuture<void> {
		return (() => {
			this.$serviceProxy.setShouldAuthenticate(false);

			this.$logger.info("Downloading project templates.");
			this.$templatesService.downloadProjectTemplates().wait();
			this.$logger.info("Downloading item templates.");
			this.$templatesService.downloadItemTemplates().wait();
			this.$logger.info("Unpacking app resources.");
			this.$templatesService.unpackAppResources().wait();
			this.$logger.info("Downloading cordova migration data.");
			this.$cordovaMigrationService.downloadCordovaMigrationData().wait();
			//Cordova files have to be downloaded after cordova migration data so we know which cordova versions we support
			this.$logger.info("Downloading cordova.js files.");
			this.$resourceDownloader.downloadCordovaJsFiles().wait();
			this.$logger.info("Downloading project file schema.");
			this.$resourceDownloader.downloadProjectFileSchema().wait();

			this.$serviceProxy.setShouldAuthenticate(true);
		}).future<void>()();
	}
}

$injector.registerCommand("dev-prepackage", PostInstallCommand);

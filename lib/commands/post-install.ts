///<reference path="../.d.ts"/>

"use strict";

import Future = require("fibers/future");

export class PostInstallCommand implements ICommand {
	constructor(private $templatesService: ITemplatesService,
		private $resourceDownloader: IResourceDownloader,
		private $logger: ILogger,
		private $serviceProxy: Server.IServiceProxy) { }

	public execute(args:string[]): IFuture<void> {
		return (() => {
			this.$serviceProxy.setShouldAuthenticate(false);

			this.$logger.info("Downloading project templates.");
			this.$templatesService.downloadProjectTemplates().wait();
			this.$logger.info("Downloading item templates.");
			this.$templatesService.downloadItemTemplates().wait();
			this.$logger.info("Unpacking app resources.");
			this.$templatesService.unpackAppResources().wait();
			this.$logger.info("Downloading cordova.js files.");
			this.$resourceDownloader.downloadCordovaJsFiles().wait();

			this.$serviceProxy.setShouldAuthenticate(true);
		}).future<void>()();
	}
}

$injector.registerCommand("dev-post-install", PostInstallCommand);

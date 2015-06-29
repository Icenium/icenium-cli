///<reference path="../../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import path = require("path");

export class PrePackageCommand implements ICommand {
	constructor(private $cordovaMigrationService: IFrameworkMigrationService,
		private $jsonSchemaLoader: IJsonSchemaLoader,
		private $logger: ILogger,
		private $resourceDownloader: IResourceDownloader,
		private $serviceProxy: Server.IServiceProxy,
		private $templatesService: ITemplatesService,
		private $nativeScriptMigrationService: IFrameworkMigrationService,
		private $fs: IFileSystem) { }

	public disableAnalytics = true;

	public allowedParameters: ICommandParameter[] = [];

	public execute(args:string[]): IFuture<void> {
		return (() => {
			this.$serviceProxy.setShouldAuthenticate(false);

			this.$logger.info("Downloading project templates.");
			this.$templatesService.downloadProjectTemplates().wait();
			this.$logger.info("Downloading item templates.");
			this.$templatesService.downloadItemTemplates().wait();
			this.$logger.info("Downloading project schemas.");
			this.$jsonSchemaLoader.downloadSchemas().wait();
			this.$logger.info("Downloading Cordova migration data.");
			this.$cordovaMigrationService.downloadMigrationData().wait();
			// Cordova files have to be downloaded after cordova migration data so we know which cordova versions we support
			this.$logger.info("Downloading cordova.js files.");
			this.$resourceDownloader.downloadCordovaJsFiles().wait();
			this.$logger.info("Downloading NativeScript migration data.")
			this.$nativeScriptMigrationService.downloadMigrationData().wait();
			this.$logger.info("Unpacking app resources.");
			this.$templatesService.unpackAppResources().wait();

			let testCoverageResultsDir = path.join(__dirname, "../../../coverage");
			this.$logger.trace(`Removing test coverage results directory: '${testCoverageResultsDir}'.`);
			this.$fs.deleteDirectory(testCoverageResultsDir).wait();

			this.$serviceProxy.setShouldAuthenticate(true);
		}).future<void>()();
	}
}

$injector.registerCommand("dev-prepackage", PrePackageCommand);

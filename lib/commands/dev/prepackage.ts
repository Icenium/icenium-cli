import * as path from "path";

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

	public async execute(args: string[]): Promise<void> {
			let jenkinsParameterSha1 = process.env.sha1;
			let jenkinsParameterBranchToBuild = process.env.BranchToBuild;

			let buildSource = jenkinsParameterBranchToBuild || jenkinsParameterSha1;

			if (buildSource) {
				// Need to set the property to config-base.json because when executing dev-config-apply the changes in config.json will be deleted.
				let configJsonDirectory = path.join(__dirname, "..", "..", "..", "config", "config-base.json");
				let configFileContent = this.$fs.readJson(configJsonDirectory);
				configFileContent.BUILD_SOURCE = buildSource;

				this.$fs.writeJson(configJsonDirectory, configFileContent);
				this.$logger.trace(`Build source ${buildSource} added to config.json.`);
			}

			this.$serviceProxy.setShouldAuthenticate(false);

			this.$logger.info("Downloading project templates.");
			await this.$templatesService.downloadProjectTemplates();
			this.$logger.info("Downloading item templates.");
			await this.$templatesService.downloadItemTemplates();
			this.$logger.info("Downloading project schemas.");
			await this.$jsonSchemaLoader.downloadSchemas();
			this.$logger.info("Downloading Cordova migration data.");
			await this.$cordovaMigrationService.downloadMigrationData();
			// Cordova files have to be downloaded after cordova migration data so we know which cordova versions we support
			this.$logger.info("Downloading cordova.js files.");
			await this.$resourceDownloader.downloadCordovaJsFiles();
			this.$logger.info("Downloading image definitions.");
			await this.$resourceDownloader.downloadImageDefinitions();
			this.$logger.info("Downloading NativeScript migration data.");
			await this.$nativeScriptMigrationService.downloadMigrationData();
			this.$logger.info("Unpacking app resources.");
			await this.$templatesService.unpackAppResources();

			let testCoverageResultsDir = path.join(__dirname, "../../../coverage");
			this.$logger.trace(`Removing test coverage results directory: '${testCoverageResultsDir}'.`);
			this.$fs.deleteDirectory(testCoverageResultsDir);

			this.$serviceProxy.setShouldAuthenticate(true);
	}
}

$injector.registerCommand("dev-prepackage", PrePackageCommand);

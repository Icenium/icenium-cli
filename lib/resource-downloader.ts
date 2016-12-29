import * as path from "path";

class ResourceDownloader implements IResourceDownloader {
	private imageDefinitionsResourcesPath: string;

	constructor(private $config: IConfiguration,
		private $cordovaResources: ICordovaResourceLoader,
		private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectConstants: Project.IConstants,
		private $resources: IResourceLoader,
		private $server: Server.IServer,
		private $injector: IInjector,
		private $staticConfig: Config.IStaticConfig) {
		this.imageDefinitionsResourcesPath = `http://${this.$config.AB_SERVER}/appbuilder/Resources/${this.$projectConstants.IMAGE_DEFINITIONS_FILE_NAME}`;
	}

	private get $cordovaMigrationService(): IFrameworkMigrationService {
		return this.$injector.resolve("cordovaMigrationService");
	}

	public async downloadCordovaJsFiles(): Promise<void> {
			let cordovaVersions = this.$cordovaMigrationService.getSupportedVersions();
			let platforms = this.$mobileHelper.platformNames;
			cordovaVersions.forEach((version) => {
				platforms.forEach((platform) => {
					let targetFilePath = this.$cordovaResources.buildCordovaJsFilePath(version, platform);
					this.$fs.createDirectory(path.dirname(targetFilePath));
					let targetFile = this.$fs.createWriteStream(targetFilePath);
					await this.$server.cordova.getJs(version, <any>platform, targetFile);
				});
			});
	}

	public async downloadResourceFromServer(remotePath: string, targetPath: string): Promise<void> {
			this.$fs.writeFile(targetPath, "");
			let file = this.$fs.createWriteStream(targetPath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");
			this.$logger.trace(`Downloading resource from server. Remote path is: '${remotePath}'. Target path is: '${targetPath}'.`);
			await this.$httpClient.httpRequest({ url: remotePath, pipeTo: file });
			await fileEnd;
	}

	public async downloadImageDefinitions(): Promise<void> {
		let targetPath = path.join(this.$staticConfig.APP_RESOURCES_DIR_NAME, this.$projectConstants.IMAGE_DEFINITIONS_FILE_NAME);
		return this.downloadResourceFromServer(this.imageDefinitionsResourcesPath, this.$resources.resolvePath(targetPath));
	}
}
$injector.register("resourceDownloader", ResourceDownloader);

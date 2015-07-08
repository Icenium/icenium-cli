///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import helpers = require("./helpers");
import util = require("util");
import constants = require("./common/mobile/constants");

export class ResourceLoader implements IResourceLoader {
	constructor(private $fs: IFileSystem, 
		private $projectConstants: Project.IProjectConstants) { }

	resolvePath(resourcePath: string): string {
		return path.join(__dirname, "../resources", resourcePath);
	}

	openFile(resourcePath: string): any {
		return this.$fs.createReadStream(this.resolvePath(resourcePath));
	}

	readJson(resourcePath: string): IFuture<any> {
		return this.$fs.readJson(this.resolvePath(resourcePath));
	}

	public buildCordovaJsFilePath(version: string, platform: string): string {
		return path.join(this.resolvePath("Cordova"), version, util.format("cordova.%s.js", platform).toLowerCase());
	}

	public getPathToAppResources(framework: string) {
		return path.join(this.resolvePath(framework), this.$projectConstants.APP_RESOURCES_DIR_NAME);
	}
}
$injector.register("resources", ResourceLoader);

class ResourceDownloader implements IResourceDownloader {
	private imageDefinitionsResourcesPath: string;
	
	constructor(private $server: Server.IServer,
		private $config: IConfiguration,
		private $logger: ILogger,
		private $httpClient: Server.IHttpClient,
		private $fs: IFileSystem,
		private $resources: IResourceLoader,
		private $cordovaMigrationService: IFrameworkMigrationService,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectConstants: Project.IProjectConstants) {
			
			this.imageDefinitionsResourcesPath = `http://${this.$config.AB_SERVER}/appbuilder/Resources/${constants.ImageConstants.ImageDefinitionsFileName}`;	
		}

	public downloadCordovaJsFiles(): IFuture<void> {
		return (() => {
			let cordovaVersions = this.$cordovaMigrationService.getSupportedVersions().wait();
			let platforms = this.$mobileHelper.platformNames;
			cordovaVersions.forEach((version) => {
				platforms.forEach((platform) => {
					let targetFilePath = this.$resources.buildCordovaJsFilePath(version, platform);
					this.$fs.createDirectory(path.dirname(targetFilePath)).wait();
					let targetFile = this.$fs.createWriteStream(targetFilePath);
					this.$server.cordova.getJs(version, <any>platform, targetFile).wait();
				});
			});
		}).future<void>()();
	}
	
	public downloadResourceFromServer(remotePath: string, targetPath: string): IFuture<void> {
		return (() => {
			this.$fs.writeFile(targetPath, "").wait();
			let file = this.$fs.createWriteStream(targetPath);
			let fileEnd = this.$fs.futureFromEvent(file, "finish");
			this.$logger.trace(`Downloading resource from server. Remote path is: '${remotePath}'. TargetPath is: '${targetPath}'.`)
			this.$httpClient.httpRequest({ url:remotePath, pipeTo: file}).wait();
			fileEnd.wait();
		}).future<void>()();
	}
	
	public downloadImageDefinitions(): IFuture<void> {
		let targetPath = path.join(this.$projectConstants.APP_RESOURCES_DIR_NAME, constants.ImageConstants.ImageDefinitionsFileName);
		return this.downloadResourceFromServer(this.imageDefinitionsResourcesPath, this.$resources.resolvePath(targetPath));
	}
}
$injector.register("resourceDownloader", ResourceDownloader);

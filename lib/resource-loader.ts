///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import helpers = require("./helpers");
import util = require("util");

export class ResourceLoader implements IResourceLoader {
	constructor(private $fs: IFileSystem) { }

	resolvePath(resourcePath: string): string {
		return path.join(__dirname, "../resources", resourcePath);
	}

	openFile(resourcePath: string): any {
		return this.$fs.createReadStream(this.resolvePath(resourcePath));
	}

	readJson(resourcePath: string): IFuture<any> {
		return this.$fs.readJson(this.resolvePath(resourcePath));
	}

	public get appResourcesDir(): string {
		return this.resolvePath("App_Resources");
	}

	public buildCordovaJsFilePath(version: string, platform: string): string {
		return path.join(this.resolvePath("Cordova"), version, util.format("cordova.%s.js", platform).toLowerCase());
	}
}
$injector.register("resources", ResourceLoader);

class ResourceDownloader implements IResourceDownloader {
	constructor(private $server: Server.IServer,
		private $fs: IFileSystem,
		private $resources: IResourceLoader,
		private $cordovaMigrationService: ICordovaMigrationService,
		private $mobileHelper: Mobile.IMobileHelper) { }

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
}
$injector.register("resourceDownloader", ResourceDownloader);

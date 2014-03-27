///<reference path=".d.ts"/>
"use strict";

import path = require("path");
import helpers = require("./helpers");
import MobileHelper = require("./mobile/mobile-helper");
import util = require("util");

class ResourceLoader implements IResourceLoader {
	constructor(private $fs: IFileSystem,
		private $server: Server.IServer) {}

	resolvePath(resourcePath: string): string {
		return path.join(__dirname, "../resources", resourcePath);
	}

	openFile(resourcePath: string): any {
		return this.$fs.createReadStream(this.resolvePath(resourcePath));
	}

	public get appResourcesDir(): string {
		return this.resolvePath("App_Resources");
	}

	public buildCordovaJsFilePath(version: string, platform: string): string {
		return path.join(this.resolvePath("Cordova"), version, util.format("cordova.%s.js", platform).toLowerCase());
	}

	public downloadCordovaJsFiles(): IFuture<void> {
		return (() => {
			var projectSchema = helpers.getProjectFileSchema();
			var cordovaVersions = projectSchema.FrameworkVersion.range;
			var platforms = Object.keys(MobileHelper.platformCapabilities);
			cordovaVersions.forEach((version) => {
				platforms.forEach((platform) => {
					var targetFilePath = this.buildCordovaJsFilePath(version, platform);
					this.$fs.createDirectory(path.dirname(targetFilePath)).wait();
					var targetFile = this.$fs.createWriteStream(targetFilePath);
					this.$server.cordova.getJs(version, platform, targetFile).wait();
				});
			});
		}).future<void>()();
	}
}
$injector.register("resources", ResourceLoader);

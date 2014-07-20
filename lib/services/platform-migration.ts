///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import path = require("path");
import helpers = require("../common/helpers");
import MobileHelper = require("../common/mobile/mobile-helper");

export class PlatformMigrationService implements Project.IPlatformMigrator {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $resources: IResourceLoader) {}

	public ensureAllPlatformAssets(): IFuture<void> {
		return ((): void => {
			Object.keys(MobileHelper.platformCapabilities).forEach((platform) => {
				this.ensureCordovaJs(platform).wait();
			})

			var appResourcesDir = this.$resources.appResourcesDir;
			var appResourceFiles = helpers.enumerateFilesInDirectorySync(appResourcesDir);
			var projectDir = this.$project.getProjectDir().wait();
			appResourceFiles.forEach((appResourceFile) => {
				var relativePath = path.relative(appResourcesDir, appResourceFile);
				var targetFilePath = path.join(projectDir, relativePath);
				this.$logger.trace("Checking app resources: %s must match %s", appResourceFile, targetFilePath);
				if (!this.$fs.exists(targetFilePath).wait()) {
					this.printAssetUpdateMessage();
					this.$logger.trace("File not found, copying %s", appResourceFile);
					this.$fs.copyFile(appResourceFile, targetFilePath).wait();
				}
			});
		}).future<void>()();
	}

	_assetUpdateMessagePrinted = false;
	private printAssetUpdateMessage() {
		if (!this._assetUpdateMessagePrinted) {
			this.$logger.info("Setting up missing asset files. Commit these assets into your source control repository.");
			this._assetUpdateMessagePrinted = true;
		}
	}

	private ensureCordovaJs(platform: string): IFuture<void> {
		return (() => {
			var cordovaJsFileName = path.join(this.$project.getProjectDir().wait(), util.format("cordova.%s.js", platform).toLowerCase());
			if (!this.$fs.exists(cordovaJsFileName).wait()) {
				this.printAssetUpdateMessage();
				var cordovaJsSourceFilePath = this.$resources.buildCordovaJsFilePath(
					this.$project.projectData.FrameworkVersion, platform);
				this.$fs.copyFile(cordovaJsSourceFilePath, cordovaJsFileName).wait();
			}
		}).future<void>()();
	}
}
$injector.register("platformMigrator", PlatformMigrationService);

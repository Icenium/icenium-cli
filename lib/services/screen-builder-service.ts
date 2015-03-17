///<reference path="../.d.ts"/>
"use strict";
import path = require("path");

export class ScreenBuilderService implements IScreenBuilderService {

	constructor(private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService,
	private $childProcess: IChildProcess,
	private $fs: IFileSystem,
	private $generatorExtensionsService: IGeneratorExtensionsService) { }

	public prepareScreenBuilder(generatorName: string): IFuture<void> {
		return (() => {
			this.$appScaffoldingExtensionsService.prepareAppScaffolding().wait();
			var appScaffoldingPath = this.$appScaffoldingExtensionsService.appScaffoldingPath;
			this.npmInstall(appScaffoldingPath).wait();

			var cacheFolderPath = path.join(appScaffoldingPath, "cache");
			var cachedGeneratorPath = path.join(appScaffoldingPath, "cache", generatorName); // Use fs-extra to ensure all path

			this.$fs.ensureDirectoryExists(cacheFolderPath).wait();
			this.$fs.ensureDirectoryExists(cachedGeneratorPath).wait();

			this.$generatorExtensionsService.prepareGenerator(generatorName, cachedGeneratorPath).wait();
			this.npmInstall(this.$generatorExtensionsService.getGeneratorCachePath(generatorName, cachedGeneratorPath)).wait();
		}).future<void>()();
	}

	private npmInstall(currentWorkingDirectory: string): IFuture<void> {
		return this.$childProcess.exec("npm install", {cwd: currentWorkingDirectory });
	}
}
$injector.register("screenBuilderService", ScreenBuilderService);
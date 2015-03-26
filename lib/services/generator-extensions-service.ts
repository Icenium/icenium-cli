///<reference path="../.d.ts"/>
"use strict";

import dependencyExtensionsServiceLib = require("./dependency-extensions-service-base");
import path = require("path");
import util = require("util");

export class GeneratorExtensionsService extends dependencyExtensionsServiceLib.DependencyExtensionsServiceBase implements IGeneratorExtensionsService {
	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		private $dependencyConfigService: IDependencyConfigService,
		private $appScaffoldingExtensionsService: IAppScaffoldingExtensionsService) {
			super($fs, $httpClient, $logger);
	}

	public getGeneratorCachePath(generatorName: string): string {
		return path.join(this.$appScaffoldingExtensionsService.appScaffoldingPath, "cache", generatorName, "latest", "node_modules", generatorName);
	}

	public prepareGenerator(generatorName: string): IFuture<void> {
		return (() => {
			var generatorConfig = this.$dependencyConfigService.getGeneratorConfig(generatorName).wait();
			generatorConfig.pathToSave = this.getGeneratorCachePath(generatorName);
			this.$fs.ensureDirectoryExists(generatorConfig.pathToSave).wait();

			this.prepareDependencyExtension(generatorName, generatorConfig).wait();
		}).future<void>()();
	}
}
$injector.register("generatorExtensionsService", GeneratorExtensionsService);
///<reference path="../.d.ts"/>
"use strict";

import dependencyExtensionsServiceLib = require("./dependency-extensions-service-base");
import path = require("path");
import util = require("util");

export class GeneratorExtensionsService extends dependencyExtensionsServiceLib.DependencyExtensionsServiceBase implements IGeneratorExtensionsService {
	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		private $dependencyConfigService: IDependencyConfigService) {
			super($fs, $httpClient, $logger);
	}

	public getGeneratorCachePath(generatorName: string, appScaffoldingPath: string): string {
		return path.join(appScaffoldingPath, "latest", "node_modules", generatorName);
	}

	public prepareGenerator(generatorName: string, appScaffoldingPath: string): IFuture<void> {
		return (() => {
			var generatorConfig = this.$dependencyConfigService.getGeneratorConfig(generatorName).wait();
			generatorConfig.pathToSave = this.getGeneratorCachePath(generatorName, appScaffoldingPath);

			this.prepareDependencyExtension(generatorName, generatorConfig).wait();
		}).future<void>()();
	}
}
$injector.register("generatorExtensionsService", GeneratorExtensionsService);
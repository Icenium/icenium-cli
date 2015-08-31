///<reference path="../.d.ts"/>
"use strict";

import * as appScaffoldingExtensionsServiceLib from "./app-scaffolding-extensions-service";
import * as path from "path";
import * as util from "util";

export class GeneratorExtensionsService extends appScaffoldingExtensionsServiceLib.AppScaffoldingExtensionsService implements IGeneratorExtensionsService {
	constructor($fs: IFileSystem,
		$httpClient: Server.IHttpClient,
		$logger: ILogger,
		$progressIndicator: IProgressIndicator,
		$config: IConfiguration,
		$childProcess: IChildProcess,
		$dependencyConfigService: IDependencyConfigService,
		$options: IOptions) {
		super($fs, $httpClient, $logger, $progressIndicator, $config, $childProcess, $dependencyConfigService, $options);
	}

	public prepareGenerator(generatorName: string): IFuture<void> {
		return (() => {
			let generatorConfig = this.$dependencyConfigService.getGeneratorConfig(generatorName).wait();
			generatorConfig.pathToSave = path.join(this.appScaffoldingPath, "H", generatorConfig.version , "node_modules");

			this.$fs.ensureDirectoryExists(generatorConfig.pathToSave).wait();

			let afterPrepareAction = () => {
				return (() => {
					let generatorCachePath = path.join(generatorConfig.pathToSave, generatorName);
					let dependencies = this.$fs.readJson(path.join(generatorCachePath, "package.json")).wait().dependencies;
					_.each(dependencies, (value, key) => {
						let packageToInstall = util.format("%s@%s", key, value);
						this.npmInstall(packageToInstall).wait();
					});

					this.npmDedupe().wait();
				}).future<void>()();
			};
			this.prepareDependencyExtension(generatorName, generatorConfig, afterPrepareAction).wait();
		}).future<void>()();
	}
}
$injector.register("generatorExtensionsService", GeneratorExtensionsService);

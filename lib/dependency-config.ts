///<reference path=".d.ts"/>
"use strict";

import path = require("path");

export class DependencyConfigService implements IDependencyConfigService {
	private static DEPENDENCY_CONFIG_NAME = "dependency-config.json";

	constructor(private $fs: IFileSystem) { }

	public get dependencyConfigFilePath(): string {
		return path.join(__dirname, "../config", DependencyConfigService.DEPENDENCY_CONFIG_NAME);
	}

	public getGeneratorConfig(generatorName: string): IFuture<IGeneratorConfig> {
		return (() => {
			var dependencyConfigContent = this.getDependencyConfigContent().wait();

			var generatorConfig = _.find(dependencyConfigContent.generators, (generator: IGeneratorConfig) => generator.name === generatorName);
			return generatorConfig;
		}).future<IGeneratorConfig>()();
	}

	public getAppScaffoldingConfig(): IFuture<IAppScaffoldingConfig> {
		return (() => {
			var dependencyConfig = this.getDependencyConfigContent().wait();
			return dependencyConfig.appScaffolding;
		}).future<IAppScaffoldingConfig>()();
	}

	private getDependencyConfigContent():IFuture<any> {
		return this.$fs.readJson(this.dependencyConfigFilePath);
	}
}
$injector.register("dependencyConfigService", DependencyConfigService);
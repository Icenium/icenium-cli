///<reference path="../.d.ts"/>
"use strict";
import * as path from "path";

export class DependencyConfigService implements IDependencyConfigService {
	private static DEPENDENCY_CONFIG_NAME = "dependency-config.json";
	private dependencyConfigCache: string;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors) { }

	public get dependencyConfigFilePath(): string {
		return path.join(__dirname, "../../config", DependencyConfigService.DEPENDENCY_CONFIG_NAME);
	}

	public getGeneratorConfig(generatorName: string): IFuture<IGeneratorConfig> {
		return (() => {
			let generators = this.getAllGenerators().wait();
			let generatorConfig = _.find(generators, (generator: IGeneratorConfig) => generator.name === generatorName);
			if(!generatorConfig) {
				this.$errors.fail("Unable to find config data for %s. Check if config/generator-config.json exists and try again.", generatorName);
			}

			return generatorConfig;
		}).future<IGeneratorConfig>()();
	}

	public getAppScaffoldingConfig(): IFuture<IAppScaffoldingConfig> {
		return (() => {
			let dependencyConfig = this.getDependencyConfigContent().wait();
			return dependencyConfig.appScaffolding;
		}).future<IAppScaffoldingConfig>()();
	}

	public getAllGenerators(): IFuture<IGeneratorConfig[]> {
		return (() => {
			let dependencyConfigContent = this.getDependencyConfigContent().wait();
			return dependencyConfigContent.generators;
		}).future<IGeneratorConfig[]>()();
	}

	private getDependencyConfigContent():IFuture<any> {
		return (() => {
			if(!this.dependencyConfigCache) {
				try {
					this.dependencyConfigCache = this.$fs.readJson(this.dependencyConfigFilePath).wait();
				} catch(e) {
					this.$errors.fail("Unable to process config/dependency-config.json file. Check if it exists and try again.");
				}
			}

			return this.dependencyConfigCache;
		}).future<any>()();
	}
}
$injector.register("dependencyConfigService", DependencyConfigService);

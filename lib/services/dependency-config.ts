import * as path from "path";

export class DependencyConfigService implements IDependencyConfigService {
	private static DEPENDENCY_CONFIG_NAME = "dependency-config.json";
	private dependencyConfigCache: string;

	constructor(private $fs: IFileSystem,
		private $errors: IErrors) { }

	public get dependencyConfigFilePath(): string {
		return path.join(__dirname, "../../config", DependencyConfigService.DEPENDENCY_CONFIG_NAME);
	}

	public getGeneratorConfig(generatorName: string): IGeneratorConfig {
		let generators = this.getAllGenerators();
		let generatorConfig = _.find(generators, (generator: IGeneratorConfig) => generator.name === generatorName);
		if (!generatorConfig) {
			this.$errors.fail("Unable to find config data for %s. Check if config/generator-config.json exists and try again.", generatorName);
		}

		return generatorConfig;
	}

	public getAppScaffoldingConfig(): IAppScaffoldingConfig {
		let dependencyConfig = this.getDependencyConfigContent();
		return dependencyConfig.appScaffolding;
	}

	public getAllGenerators(): IGeneratorConfig[] {
		let dependencyConfigContent = this.getDependencyConfigContent();
		return dependencyConfigContent.generators;
	}

	private getDependencyConfigContent(): any {
		if (!this.dependencyConfigCache) {
			try {
				this.dependencyConfigCache = this.$fs.readJson(this.dependencyConfigFilePath);
			} catch (e) {
				this.$errors.fail("Unable to process config/dependency-config.json file. Check if it exists and try again.");
			}
		}

		return this.dependencyConfigCache;
	}
}

$injector.register("dependencyConfigService", DependencyConfigService);

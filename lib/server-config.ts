export class ServerConfiguration implements IServerConfiguration {
	private cachedServerConfiguration: any = null;

	constructor(private $config: IConfiguration,
		private $injector: IInjector) { }

	private async getConfigurationFromServer(): Promise<any> {
		if (!this.cachedServerConfiguration) {
			let configUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + "/appbuilder/configuration.json";
			let httpClient = this.$injector.resolve("httpClient");
			this.cachedServerConfiguration = JSON.parse((await httpClient.httpRequest(configUri)).body);
		}

		return this.cachedServerConfiguration;
	}

	public async tfisServer(): Promise<string> {
		return (await this.getConfigurationFromServer()).stsServer;
	}

	public async assemblyVersion(): Promise<string> {
		return (await this.getConfigurationFromServer()).assemblyVersion;
	}

	public async resourcesPath(): Promise<string> {
		let resourcesRelativePath = (await this.getConfigurationFromServer()).resourcesPath;
		return `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/${resourcesRelativePath}`;
	}
}
$injector.register("serverConfiguration", ServerConfiguration);

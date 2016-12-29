export class ServerConfiguration implements IServerConfiguration {
	private cachedServerConfiguration: any = null;

	constructor(private $config: IConfiguration,
		private $injector: IInjector) { }

	private async getConfigurationFromServer(): Promise<any> {
			if(!this.cachedServerConfiguration) {
				let configUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + "/appbuilder/configuration.json";
				let httpClient = this.$injector.resolve("httpClient");
				this.cachedServerConfiguration = (await  JSON.parse(httpClient.httpRequest(configUri)).body);
			}

			return this.cachedServerConfiguration;
	}

	public async get tfisServer(): Promise<string> {
			return this.getConfigurationFromServer().wait().stsServer;
	}

	public async get assemblyVersion(): Promise<string> {
			return this.getConfigurationFromServer().wait().assemblyVersion;
	}

	public async get resourcesPath(): Promise<string> {
			let resourcesRelativePath = (await  this.getConfigurationFromServer()).resourcesPath;
			return `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/${resourcesRelativePath}`;
	}
}
$injector.register("serverConfiguration", ServerConfiguration);

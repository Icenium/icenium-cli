///<reference path=".d.ts"/>

export class ServerConfiguration implements IServerConfiguration {
	private cachedServerConfiguration = null;

	constructor(private $config: IConfiguration) { }

	private getConfigurationFromServer(): IFuture<any> {
		return (() => {
			if(!this.cachedServerConfiguration) {
				var configUri = this.$config.AB_SERVER_PROTO + "://" + this.$config.AB_SERVER + "/configuration.json";
				var httpClient = $injector.resolve("httpClient");
				this.cachedServerConfiguration = JSON.parse(httpClient.httpRequest(configUri).wait().body);
			}

			return this.cachedServerConfiguration;
		}).future<any>()();
	}

	public get tfisServer(): IFuture<string> {
		return (() => {
			return this.getConfigurationFromServer().wait().stsServer;
		}).future<string>()();
	}

	public get assemblyVersion(): IFuture<string> {
		return (() => {
			return this.getConfigurationFromServer().wait().assemblyVersion;
		}).future<string>()();
	}
}
$injector.register("serverConfiguration", ServerConfiguration);

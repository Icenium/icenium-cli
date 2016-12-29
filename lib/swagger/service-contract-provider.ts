export class ServiceContractProvider implements Server.IServiceContractProvider {
	constructor(private $httpClient: Server.IHttpClient,
				private $config: IConfiguration) {
	}

	async getApi(path?: string): Promise<Swagger.ISwaggerServiceContract> {
			let request:any = {
				proto: this.$config.AB_SERVER_PROTO,
				host: this.$config.AB_SERVER,
				path: "/appbuilder/api/swagger",
				method: "GET"
			};

			if (path) {
				request.path += path;
			}

			let result = await  this.$httpClient.httpRequest(request);
			if (result.error) {
				throw result.error;
			} else {
				return JSON.parse(result.body);
			}
	}
}
$injector.register("serviceContractProvider", ServiceContractProvider);

declare module Server {
	interface IResponse {
		response: any;
		body?: string;
		headers: any;
		error?: Error;
	}

	interface IServiceProxy {
		call(method: string, path: string, accept: string, body: any, resultStream: WritableStream): any;
	}

	interface IHttpClient {
		httpRequest(options): IResponse;
	}

	interface IServiceContractGenerator {
		generate(): void;
	}

	interface IServiceContractProvider {
		getApi(): Server.Contract.IService[];
	}

	interface IIdentityManager {
		listCertificates(): void;
		listProvisions(): void;
		findCertificate(identityStr, callback): void;
		findProvision(provisionStr, callback): void;
	}
}

declare module Server.Contract {
	interface IParameter {
		name: string;
		binding: {
			type: string;
			contentType: string;
		}
		routePrefixes: string[];
		routeSuffixes: string[];
	}

	interface IOperation {
		name: string;
		actionName: string;
		httpMethod: string;
		responseType: string;
		routePrefixes: string[];
		routeSuffixes: string[];
		parameters: IParameter[];
	}

	interface IService {
		name: string;
		endpoint: string;
		operations: IOperation[];
	}
}
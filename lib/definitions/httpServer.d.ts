interface IHttpServerConfig {
	routes: { [key:string]: Function };
	catchAll?: (request: any /*http.ServerRequest*/, response: any /*http.ServerResponse*/) => void;
}

interface IHttpServer {
	createServer(configuration: IHttpServerConfig): any;
	serveFile(fileName: string): (request: any /*http.ServerRequest*/, response: any /*http.ServerResponse*/) => void;
	redirect(response: any /*http.ServerResponse*/, targetUrl: string): void;
}

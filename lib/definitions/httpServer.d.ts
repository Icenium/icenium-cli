interface IHttpServer {
	createServer(configuration): any;
	serveFile(fileName): (request, response) => void;
	redirect(response, targetUrl: string): void;
}
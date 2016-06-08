import * as http from "http";
import * as url from "url";
import * as path from "path";

export class HttpServer implements IHttpServer {
	constructor(private $logger: ILogger,
		private $fs: IFileSystem) { }

	public createServer(configuration: IHttpServerConfig): http.Server {
		if (!configuration.catchAll) {
			configuration.catchAll = (request: http.ServerRequest, response: http.ServerResponse) => {
				response.statusCode = 404;
				response.end();
			};
		}

		return http.createServer((request: http.ServerRequest, response: http.ServerResponse) => {
			let uriPath = url.parse(request.url).pathname;

			this.$logger.debug("Serving '%s'", uriPath);

			response.setHeader("Connection", "close");

			if (!configuration.routes[uriPath]) {
				configuration.catchAll(request, response);
			} else {
				configuration.routes[uriPath](request, response);
			}
		});
	}

	public serveFile(fileName: string): (_request: http.ServerRequest, _response: http.ServerResponse) => void {
		return (request: http.ServerRequest, response: http.ServerResponse) => {
			let mimeTypes: IStringDictionary = {
				".html": "text/html",
				".jpeg": "image/jpeg",
				".jpg": "image/jpeg",
				".png": "image/png",
				".js": "text/javascript",
				".css": "text/css"
			};

			this.$logger.debug("Returning '%s'", fileName);

			let mimeType = mimeTypes[path.extname(fileName)];
			response.statusCode = 200;
			response.setHeader("Content-Type", mimeType);

			this.$fs.createReadStream(fileName).pipe(response);
		};
	}

	public redirect(response: http.ServerResponse, targetUrl: string): void {
		response.statusCode = 302;
		response.setHeader("Location", targetUrl);
		response.end();
	}
}
$injector.register("httpServer", HttpServer);

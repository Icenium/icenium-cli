///<reference path=".d.ts"/>

import http = require("http");
import url = require("url");
import path = require("path");
import helpers = require("./helpers");

export class HttpServer implements IHttpServer {
	constructor(private $logger: ILogger) { }

	public createServer(configuration): http.Server {
		if (!configuration.catchAll) {
			configuration.catchAll = (request, response) => {
				response.statusCode = 404;
				response.end();
			};
		}

		return http.createServer((request, response) => {
			var uriPath = url.parse(request.url).pathname;

			this.$logger.debug("Serving '%s'", uriPath);

			response.setHeader("Connection", "close");

			if (!configuration.routes[uriPath]) {
				configuration.catchAll(request, response);
			} else {
				configuration.routes[uriPath](request, response);
			}
		});
	}

	public serveFile(fileName): (request, response) => void {
		return (request, response) => {
			var mimeTypes = {
				".html": "text/html",
				".jpeg": "image/jpeg",
				".jpg": "image/jpeg",
				".png": "image/png",
				".js": "text/javascript",
				".css": "text/css"
			};

			this.$logger.debug("Returning '%s'", fileName);

			var mimeType = mimeTypes[path.extname(fileName)];
			response.statusCode = 200;
			response.setHeader("Content-Type", mimeType);

			var $fs = $injector.resolve("fs");
			$fs.createReadStream(fileName).pipe(response);
		};
	}

	public redirect(response, targetUrl: string): void {
		response.statusCode = 302;
		response.setHeader("Location", targetUrl);
		response.end();
	}
}
$injector.register("httpServer", HttpServer);

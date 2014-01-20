///<reference path=".d.ts"/>

"use strict";

import http = require("http");
import url = require("url");
import path = require("path");
import fs = require("fs");
import log = require("./logger");
import helpers = require("./helpers");

export function createServer(configuration): http.Server {
	if (!configuration.catchAll) {
		configuration.catchAll = function(request, response) {
			response.writeHead(404);
			response.end();
		};
	}

	return http.createServer(function(request, response) {
		var uriPath = url.parse(request.url).pathname;

		log.debug("Serving '%s'", uriPath);

		if (!configuration.routes[uriPath]) {
			configuration.catchAll(request, response);
		} else {
			configuration.routes[uriPath](request, response);
		}

		response.on("finish", function() {
			request.connection.destroy();
		});
	});
}

export function serveFile(fileName) {
	return function(request, response) {
		var mimeTypes = {
			".html": "text/html",
			".jpeg": "image/jpeg",
			".jpg": "image/jpeg",
			".png": "image/png",
			".js": "text/javascript",
			".css": "text/css"
		};

		log.debug("Returning '%s'", fileName);

		var mimeType = mimeTypes[path.extname(fileName)];
		response.writeHead(200, {"Content-Type": mimeType});

		fs.createReadStream(fileName).pipe(response);
	};
}

export function serveText(callback: () => string, mimeType: string) {
	return function(request, response) {
		var text = callback();
		log.debug("Content-Type: '%s', Body: '%s'", mimeType, text);
		response.writeHead(200, {"Content-Type": mimeType});
		response.end(text);
	};
}

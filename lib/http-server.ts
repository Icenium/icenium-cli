///<reference path=".d.ts"/>

"use strict";

import http = require("http");
import url = require("url");
import path = require("path");
import log = require("./logger");
import helpers = require("./helpers");

export function createServer(configuration): http.Server {
	if (!configuration.catchAll) {
		configuration.catchAll = function(request, response) {
			response.statusCode = 404;
			response.end();
		};
	}

	return http.createServer(function(request, response) {
		var uriPath = url.parse(request.url).pathname;

		log.debug("Serving '%s'", uriPath);

		response.setHeader("Connection", "close");

		if (!configuration.routes[uriPath]) {
			configuration.catchAll(request, response);
		} else {
			configuration.routes[uriPath](request, response);
		}
	});
}

export function serveFile(fileName): (request, response) => void {
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
		response.statusCode = 200;
		response.setHeader("Content-Type", mimeType);

		var $fs = $injector.resolve("fs");
		$fs.createReadStream(fileName).pipe(response);
	};
}

export function serveText(callback: () => string, mimeType: string) {
	return function(request, response) {
		var text = callback();
		log.debug("Content-Type: '%s', Body: '%s'", mimeType, text);
		response.statusCode = 200;
		response.setHeader("Content-Type", mimeType);
		response.end(text);
	};
}

export function redirect(response, targetUrl: string): void {
	response.statusCode = 302;
	response.setHeader("Location", targetUrl);
	response.end();
}
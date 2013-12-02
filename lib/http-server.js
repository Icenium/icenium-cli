"use strict";


(function() {

	var http = require("http"),
		url = require("url"),
		path = require("path"),
		fs = require("fs"),
		log = require("./log"),
		helpers = require("./helpers");

	function createServer(configuration) {
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

	function serveFile(fileName) {
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

	function serveText(callback, mimeType) {
		helpers.ensureCallback(callback, 0);
		helpers.ensureString(mimeType, 1);
		return function(request, response) {
			var text = callback();
			log.debug("Content-Type: '%s', Body: '%s'", mimeType, text);
			response.writeHead(200, {"Content-Type": mimeType});
			response.end(text);
		};
	}

	exports.createServer = createServer;
	exports.serveFile = serveFile;
	exports.serveText = serveText;
})();

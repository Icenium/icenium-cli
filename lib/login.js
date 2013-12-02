"use strict";

(function(){
	var util = require("util"),
		path = require("path"),
		xopen = require("open"),
		fileSrv = require("./http-server"),
		log = require("./log"),
		config = require("./config");

	function serveLoginFile(relPath) {
		return fileSrv.serveFile(path.join(path.join(__dirname, "..\\resources\\login"), relPath));
	}

	function login() {

		var loginConfig = {
			tfisServer: "https://" + config.TFIS_SERVER,
			clientId: "uri:ice",
		};

		var localhostServer = fileSrv.createServer({
			routes: {
				"/login": serveLoginFile("login.html"),
				"/knockout.js": serveLoginFile("knockout-3.0.0.js"),
				"/style.css": serveLoginFile("style.css"),
				"/login-config.js": fileSrv.serveText(function() {
					return "var loginConfig = " + JSON.stringify(loginConfig);
				}, "text/javascript"),
				"/end": function (request, response) {
					serveLoginFile("end.html")(request, response);

					log.debug("Login complete: " + request.url);
					localhostServer.close();
				}
			}
		});

		localhostServer.on("listening", function() {
			var port = localhostServer.address().port;
			var host = util.format("http://localhost:%s/", port);

			loginConfig.callbackUrl = host + "end";

			xopen(host + "login");
		});

		localhostServer.listen(0);
	}

	exports.login = login;
})();

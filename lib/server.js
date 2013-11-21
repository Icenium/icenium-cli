"use strict";

(function() {
	var querystring = require("querystring"),
		log = require("./log"),
		options = require("./options"),
		fs = require("fs"),
		path = require("path"),
		config = require("./config"),
		cookie = require("cookie"),
		iceAuthCookie;

	function httpRequest(options, callback) {
		var requestProto =  options.proto || "http";
		delete options.proto;
		var body = options.body;
		delete options.body;

		var proto = config.PROXY_TO_FIDDLER ? "http" : requestProto;
		var http = require(proto);

		if (config.PROXY_TO_FIDDLER) {
			options.path = requestProto + "://" + options.host + options.path;
			options.headers["Host"] = options.host;
			options.host = "127.0.0.1";
			options.port = 8888;
		}

		var request = http.request(options, function (response) {
			var data = "";

			response.on('data', function (chunk) {
				log.trace("httpRequest: Receiving data:\n" + chunk);
				data += chunk;
			})
			response.on('end', function () {
				log.trace("httpRequest: Done.");
				callback({
					body: data,
					response: response,
					headers: response.headers,
				});
			})
		});

		log.trace("httpRequest: Sending:\n%s", body);
		request.end(body);
	}

	function basicLogin(userName, password, callback) {
		var loginData = {
			wrap_username: userName,
			wrap_password: password,
			wrap_client_id: "uri:ice"
		};

		httpRequest({
			proto: "https",
			host: config.TFIS_SERVER,
			path: "/Authenticate/WRAPv0.9",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: querystring.stringify(loginData)
		}, function (wrapResponse) {
			if (wrapResponse.response.statusCode !== 200) {
				callback(null, wrapResponse.response);
				return;
			}

			var wrapData = querystring.parse(wrapResponse.body),
				wrap_access_token = wrapData["wrap_access_token"];

			httpRequest({
				host: config.ICE_SERVER,
				path: "/api/authentication",
				method: "POST",
				headers: {
					"Content-Type": "application/vnd.icenium+json"
				},
				body: JSON.stringify(wrap_access_token)
			}, function (iceResponse) {
				var newCookies = iceResponse.headers["set-cookie"],
					token;

				if (newCookies) {
					newCookies.forEach(function(cookieStr) {
						var parsed = cookie.parse(cookieStr);
						Object.keys(parsed).forEach(function(key) {
							if (key.toUpperCase() === ".ASPXAUTH") {
								token = parsed[key];
							}
						});
					});
				}

				if (token) {
					iceAuthCookie = token;
				}
				callback(token, iceResponse.response);
			});
		})
	}

	function getCookieFilePath() {
		return path.join(options["profile-dir"], "cookie");
	}

	function getCookie() {
		if (!iceAuthCookie) {
			var cookieFilePath = getCookieFilePath();

			if (!fs.exists(cookieFilePath)) {
				log.error("error: not logged in.");
				return;
			}

			iceAuthCookie = fs.readFileSync(cookieFilePath);
		}

		return iceAuthCookie;
	}

	function prepareUserDirectory() {
		var profileDir = options["profile-dir"];
		if (!fs.existsSync(profileDir)) {
			fs.mkdirSync(profileDir);
		}
	}

	function loginCommand(userName, password) {
		var cookieFilePath = getCookieFilePath();
		if (fs.existsSync(cookieFilePath)) {
			fs.unlinkSync(cookieFilePath);
		}

		log.debug("Logging in with user name '%s' and password '%s'", userName, password);

		basicLogin(userName, password, function(auth) {
			log.debug("Cookie is '%s'", auth);

			if (!auth) {
				log.fatal("Login failed.");
				return;
			}

			prepareUserDirectory();
			fs.writeFileSync(cookieFilePath, auth);
		});
	}

	exports.basicLogin = basicLogin;
	exports.loginCommand = loginCommand;
})();

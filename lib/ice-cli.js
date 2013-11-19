"use strict";

(function() {
	var querystring = require("querystring")
		, config = require("./config")
		, loginData;

	function httpGet(options, callback) {
		var http = require(options.proto || "http")
			, request;

		request = http.request(options, function (response) {
			var data = "";

			response.on('data', function (chunk) {
				data += chunk;
			})
			response.on('end', function () {
				callback({
					body: data,
					headers: response.headers
				});
			})
		});

		request.end(options.body);
	}

	function basicLogin(userName, password, callback) {
		loginData = {
			wrap_username: userName,
			wrap_password: password,
			wrap_client_id: "uri:ice"
		};

		httpGet({
			proto: "https",
			host: config.TFIS_SERVER,
			path: "/Authenticate/WRAPv0.9",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: querystring.stringify(loginData)
		}, function (wrapResponse) {

			var wrapData = querystring.parse(wrapResponse.body)
				, wrap_access_token = wrapData["wrap_access_token"];

			httpGet({
				host: config.ICE_SERVER,
				path: "/api/authentication",
				method: "POST",
				headers: {
					"Content-Type": "application/vnd.icenium+json"
				},
				body: JSON.stringify(wrap_access_token)
			}, function (iceResponse) {
				var cookie = require("cookie")
					, newCookies = iceResponse.headers["set-cookie"]
					, token;

				newCookies.forEach(function(cookieStr) {
					var parsed = cookie.parse(cookieStr);
					Object.keys(parsed).forEach(function(key) {
						if (key.toUpperCase() === ".ASPXAUTH") {
							token = parsed[key];
						}
					});
				});

				callback(token);
			});
		})
	}

	basicLogin("tailsu@gmail.com", "pDoVKoPCCRV4", function (auth) {
		var fs = require("fs");
		fs.writeFile("cookie.tmp", auth);
	})


})();

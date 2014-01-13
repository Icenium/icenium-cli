///<reference path=".d.ts"/>

"use strict";

import util = require("util");
import path = require("path");
import url = require("url");
import fs = require("fs");
import Q = require("q");
import xopen = require("open");
import server = require("./server");
import fileSrv = require("./http-server");
import log = require("./logger");
import options = require("./options");
import config = require("./config");
import user = require("./user");

var iceAuthCookie;

function prepareUserDirectory() {
	var profileDir = options["profile-dir"];
	if (!fs.existsSync(profileDir)) {
		fs.mkdirSync(profileDir);
	}
}

function removeCookies() {
	return removeFile(getCookieFilePath());
}

function removeFile(filePath) {
	return Q.ninvoke(fs, "unlink", filePath)
		.catch(function() {});
}

export function getCookie() {
	if (!iceAuthCookie) {
		var cookieFilePath = getCookieFilePath();

		if (!fs.existsSync(cookieFilePath)) {
			throw new Error("error: not logged in.");
		}

		iceAuthCookie = fs.readFileSync(cookieFilePath);
	}

	return iceAuthCookie;
}

function serveLoginFile(relPath) {
	return fileSrv.serveFile(path.join(path.join(__dirname, "..", "resources", "login"), relPath));
}

function loginInBrowser(callback): void {
	log.debug("Begin browser login.");

	var loginConfig:any = {
		tfisServer: "https://" + config.TFIS_SERVER,
		clientId: "uri:ice",
		callbackUrl: util.format("%s://%s/Mist/Authentication/RedirectVerification", config.ICE_SERVER_PROTO, config.ICE_SERVER),
	};

	var localhostServer = fileSrv.createServer({
		routes: {
			"/login": serveLoginFile("login.html"),
			"/knockout.js": serveLoginFile("knockout-3.0.0.js"),
			"/style.css": serveLoginFile("style.css"),
			"/login-config.js": fileSrv.serveText(function() {
				return "var loginConfig = " + JSON.stringify(loginConfig);
			}, "text/javascript"),
			"/completeLogin": function (request, response) {
				serveLoginFile("end.html")(request, response);

				log.debug("Login complete: " + request.url);
				localhostServer.close();

				var code = url.parse(request.url, true).query.wrap_verification_code;
				log.debug("Verification code: '%s'", code);
				server.authenticate({ wrap_verification_code: code }, callback);
			}
		}
	});

	localhostServer.on("listening", function() {
		var port = localhostServer.address().port;
		var host = util.format("http://localhost:%s/", port);

		loginConfig.clientState = host + "completeLogin";

		xopen(host + "login");
	});

	localhostServer.listen(0);
}

export function loginCommand() {
	logout()
		.then(function() {
			return Q.nfcall(loginInBrowser);
		})
		.then(function(result:any): any {
			log.debug("Cookie is '%s'", result.auth);

			if (!result.auth) {
				log.fatal("Login failed.");
				return;
			}

			if (result.auth) {
				iceAuthCookie = result.auth;
			}

			prepareUserDirectory();
			return Q.all([
				saveCookies(result.auth),
				user.saveUserState(result.user)
			]);
		})
		.done();
}

function saveCookies(authToken) {
	return Q.ninvoke(fs, "writeFile", getCookieFilePath(), authToken);
}

function getCookieFilePath() {
	return path.join(options["profile-dir"], "cookie");
}

export function logoutCommand() {
	logout()
		.done();
}

function logout() {
	log.debug("Logging out...");
	return Q.all([
			removeCookies(),
			user.deleteUserState()
		])
		.then(function() {
			log.debug("Logout completed.");
		});
}

export function telerikLogin(userName, password) {
	server.basicLogin(userName, password, function(err) {
		if (err) {
			throw err;
		}
		log.info("Login completed.");
	});
}


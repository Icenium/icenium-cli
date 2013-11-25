"use strict";

(function() {
	require("./extensions");

	var options = require("./options"),
		server = require("./server"),
		project = require("./project"),
		log = require("./log"),
		util = require("util"),
		path = require("path");

	function dispatchCommand() {
		var remaining = options.argv.remain,
			commands = {
				"login": server.loginCommand,
				"build": project.build,
			};

		if (remaining.length > 0) {
			var commandName = remaining[0];
			log.info("Executing '%s'", commandName);
			var impl = commands[commandName.toLowerCase()];
			if (!impl) {
				log.fatal("unknown command '%s'", cmd);
			}
			impl.apply(null, remaining.slice(1));
		}
	}

	if (options["password"] !== undefined && options["user-name"] !== undefined) {
		server.basicLogin(options["user-name"], options["password"], function (auth) {
			if (!auth) {
				log.fatal("Login failed");
				return;
			}

			dispatchCommand();
		})
	} else {
		dispatchCommand();
	}

})();

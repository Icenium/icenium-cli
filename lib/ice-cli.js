(function() {
	"use strict";
	require("./extensions");
	var options = require("./options"),
		server = require("./server"),
		project = require("./project"),
		identity = require("./identity"),
		login = require("./login"),
		log = require("./log");

	function dispatchCommand() {
		var remaining = options.argv.remain,
			commands = {
				"login": server.loginCommand,
				"login2": login.login,
				"build": project.buildCommand,
				"list-certificates": identity.listCertificates,
				"list-provisions": identity.listProvisions,
				"update": project.importProject,
				"ion": project.deployToIon,
				"deploy": project.deployToDevice,
				"create": project.createFromTemplate,
			};

		if (remaining.length > 0) {
			var commandName = remaining[0];
			log.debug("Executing '%s'", commandName);
			var impl = commands[commandName.toLowerCase()];
			if (!impl) {
				log.fatal("unknown command '%s'", commandName);
				return;
			}
			impl.apply(null, remaining.slice(1));
		}
	}

	if (options.password !== undefined && options["user-name"] !== undefined) {
		server.basicLogin(options["user-name"], options.password, function (auth) {
			if (!auth) {
				log.fatal("Login failed");
				return;
			}

			dispatchCommand();
		});
	} else {
		dispatchCommand();
	}

})();

(function() {
	"use strict";
	require("./extensions");
	var options = require("./options"),
		server = require("./server"),
		project = require("./project"),
		identity = require("./identity"),
		login = require("./login"),
		log = require("./log"),
		help = require("./help");

	function dispatchCommand() {
		var remaining = options.argv.remain,
			commands = {
				"login": login.loginCommand,
				"telerik-login": login.telerikLogin,
				"build": project.buildCommand,
				"list-certificates": identity.listCertificates,
				"list-provisions": identity.listProvisions,
				"update": project.importProject,
				"ion": project.deployToIon,
				"deploy": project.deployToDevice,
				"create": project.createFromTemplate,
				"help": help.printHelp,
			};

		if (remaining.length > 0) {
			var commandName = remaining[0];
			log.debug("Executing '%s'", commandName);
			var impl = commands[commandName.toLowerCase()];
			if (!impl) {
				log.fatal("Unknown command '%s'. Use 'ice help' for help.", commandName);
				return;
			}
			impl.apply(null, remaining.slice(1));
		} else {
			help.printHelp();
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

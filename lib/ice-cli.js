(function() {
	"use strict";
	require("./extensions");
	var options = require("./options"),
		config = require("./config"),
		server = require("./server"),
		project = require("./project"),
		identity = require("./identity"),
		log = require("./log"),
		devicesService = require("./devices-service"),
		syncService = require("./sync-service"),
		login = require("./login"),
		help = require("./help");

	function dispatchCommand() {
		var remaining = options.argv.remain,
			commands = {
				"login": login.loginCommand,
				"config-reset": config.reset,
				"config-apply": config.apply,
				"telerik-login": login.telerikLogin,
				"build": project.buildCommand,
				"list-certificates": identity.listCertificates,
				"list-provisions": identity.listProvisions,
				"update": project.importProject,
				"ion": project.deployToIon,
				"deploy": project.deployToDevice,
				"create": project.createFromTemplate,
				"sync": syncService.sync,
				"list-devices": devicesService.listDevices,
				"open-device-logstream": devicesService.openDeviceLogStream,
				"help": help.printHelp
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

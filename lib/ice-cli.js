(function() {
	"use strict";
	require("./extensions");

	var commands = {
		"login": makeCommand("login", "loginCommand"),
		"config-reset": makeCommand("config", "reset"),
		"config-apply": makeCommand("config", "apply"),
		"telerik-login": makeCommand("login", "telerikLogin"),
		"build": makeCommand("project", "buildCommand"),
		"list-certificates": makeCommand("identity", "listCertificates"),
		"list-provisions": makeCommand("identity", "listProvisions"),
		"prop-set": makeCommand("project", "setProjectProperty"),
		"prop-add": makeCommand("project", "addProjectProperty"),
		"prop-del": makeCommand("project", "delProjectProperty"),
		"prop-cat": makeCommand("project", "printProjectProperty"),
		"update": makeCommand("project", "importProject"),
		"ion": makeCommand("project", "deployToIon"),
		"deploy": makeCommand("project", "deployToDevice"),
		"create": makeCommand("project", "createFromTemplate"),
		"sync": makeCommand("syncService", "sync"),
		"list-devices": makeCommand("devicesService", "listDevices"),
		"open-device-logstream": makeCommand("devicesService", "openDeviceLogStream"),
		"help": makeCommand("help", "printHelp")
	};

	function dispatchCommand() {
		var options = require("./options");
		var remaining = options.argv.remain;
		if (remaining.length > 0) {
			var commandName = remaining[0];
			var impl = commands[commandName.toLowerCase()];
			if (!impl) {
				require("./log").fatal("Unknown command '%s'. Use 'ice help' for help.", commandName);
				return;
			}
			impl().apply(null, remaining.slice(1));
		} else {
			commands["help"]()();
		}
	}

	function completeCommand() {
		var tabtab = require("tabtab");
		tabtab.complete("ice", function(err, data) {
			if (err || !data) {
				return;
			}

			var deviceSpecific = ["build", "deploy"];

			if (data.last.startsWith("--")) {
				tabtab.log(Object.keys(require("./options").knownOpts), data, "--");
			} else if (deviceSpecific.contains(data.prev)) {
				tabtab.log(["ios", "android"], data);
			} else {
				tabtab.log(Object.keys(commands), data);
			}
		});

		return true;
	}

	function makeCommand(module, command) {
		return function() {
			return require("./" + module)[command];
		}
	}

	if (process.argv[2] === "completion") {
		completeCommand();
	} else {
		dispatchCommand();
	}
})();

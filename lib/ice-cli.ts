///<reference path=".d.ts"/>
import Fiber = require("fibers");

(function() {
	"use strict";
	require("./extensions");
	require("./bootstrap");
	var util = require("util");
	var options = require("./options");

	var commands = {
		"login": makeCommand("login", "loginCommand"),
		"logout": makeCommand("login", "logoutCommand"),
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
		"create": makeCommand("project", "createNewProject"),
		"sync": makeCommand("sync-service", "sync"),
		"list-devices": makeCommand("devices-service", "listDevices"),
		"open-device-log-stream": makeCommand("devices-service", "openDeviceLogStream"),
		"list-projects": makeCommand("remote-projects", "listProjects"),
		"export-project": makeCommand("remote-projects", "exportProject")
	};

	function dispatchCommandInFiber() {
		Fiber(() => dispatchCommand()).run();
	}

	function dispatchCommand() {
		var commandName = getCommandName();
		var commandArguments = getCommandArguments();

		var command = commands[commandName];
		if (command) {
			command().apply(null, commandArguments);
			return;
		}

		command = $injector.resolveCommand(commandName);
		if (command) {
			var commandData = command.getDataFactory().fromCliArguments(commandArguments);
			if (command.canExecute(commandData)) {
				command.execute(commandData);
			}
			return;
		}

		require("./log").fatal("Unknown command '%s'. Use 'ice help' for help.", commandName);
		return;
	}

	function getCommandName(): string {
		var remaining = options.argv.remain;
		if (remaining.length > 0) {
			return remaining[0].toLowerCase();
		}
		return "help";
	}

	function getCommandArguments(): string[] {
		var remaining = options.argv.remain;
		if (remaining.length > 1) {
			return remaining.slice(1);
		}
		return [];
	}

	function completeCommand() {
		var tabtab = require("tabtab");
		tabtab.complete("ice", function(err, data) {
			if (err || !data) {
				return;
			}

			var deviceSpecific = ["build", "deploy"];
			var propertyCommands = ["prop-cat", "prop-set", "prop-add", "prop-del"];

			if (data.last.startsWith("--")) {
				return tabtab.log(Object.keys(require("./options").knownOpts), data, "--");
			} else if (deviceSpecific.contains(data.prev)) {
				return tabtab.log(["ios", "android"], data);
			} else {
				var _ = require("underscore");
				var propSchema = require("./helpers").getProjectFileSchema();
				if (propertyCommands.contains(data.prev)) {
					return tabtab.log(Object.keys(propSchema), data);
				} else if (_.some(propertyCommands, function(cmd) {
					return data.line.indexOf(" " + cmd + " ") >= 0;
				})) {
					var parseResult = /prop-[^ ]+ ([^ ]+) /.exec(data.line);
					if (parseResult) {
						var propName = parseResult[1];
						if (propName && propSchema[propName]) {
							var range = propSchema[propName].range;
							if (range) {
								if (!_.isArray(range)) {
									var helpers = require("./helpers");
									range = _.map(range, function(value, key) {
										return value.input || key;
									});
								}
								return tabtab.log(range, data);
							}
						}
					}
				}
				return tabtab.log(Object.keys(commands), data);
			}
		});

		return true;
	}

	function makeCommand(module, command) {
		return function() {
			return require("./" + module)[command];
		};
	}

	if (process.argv[2] === "completion") {
		completeCommand();
	} else {
		dispatchCommandInFiber();
	}
})();

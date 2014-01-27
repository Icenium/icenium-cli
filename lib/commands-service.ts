///<reference path=".d.ts"/>
"use strict";

export class CommandsService implements ICommandsService {
	private commands = {
		"config-reset": this.makeCommand("config", "reset"),
		"config-apply": this.makeCommand("config", "apply"),
		"build": this.makeCommand("project", "buildCommand"),
		"prop-set": this.makeCommand("project", "setProjectProperty"),
		"prop-add": this.makeCommand("project", "addProjectProperty"),
		"prop-del": this.makeCommand("project", "delProjectProperty"),
		"prop-cat": this.makeCommand("project", "printProjectProperty"),
		"update": this.makeCommand("project", "importProject"),
		"ion": this.makeCommand("project", "deployToIon"),
		"deploy": this.makeCommand("project", "deployToDevice"),
		"create": this.makeCommand("project", "createNewProject"),
		"sync": this.makeCommand("sync-service", "sync"),
		"list-devices": this.makeCommand("devices-service", "listDevices"),
		"open-device-log-stream": this.makeCommand("devices-service", "openDeviceLogStream"),
		"list-projects": this.makeCommand("remote-projects", "listProjects"),
		"export-project": this.makeCommand("remote-projects", "exportProject")
	};

	public executeCommand(commandName: string, commandArguments: string[]): boolean {
		var command = this.commands[commandName];
		if (command) {
			command().apply(null, commandArguments);
			return true;
		}

		command = $injector.resolveCommand(commandName);
		if (command) {
			var commandData = command.getDataFactory().fromCliArguments(commandArguments);
			if (command.canExecute(commandData)) {
				command.execute(commandData);
			}
			return true;
		}

		return false;
	}

	public completeCommand() {
		var tabtab = require("tabtab");
		tabtab.complete("ice", function (err, data) {
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
				} else if (_.some(propertyCommands, function (cmd) {
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
									range = _.map(range, function (value, key) {
										return value.input || key;
									});
								}
								return tabtab.log(range, data);
							}
						}
					}
				}
				return tabtab.log(Object.keys(this.commands), data);
			}
		});

		return true;
	}

	private makeCommand(module, command) {
		return function () {
			return require("./" + module)[command];
		};
	}
}
$injector.register("commands-service", CommandsService);
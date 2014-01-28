///<reference path=".d.ts"/>
"use strict";

import _ = require("underscore");

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
		tabtab.complete("ab", (err, data) => {
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
				var propSchema = require("./helpers").getProjectFileSchema();
				if (propertyCommands.contains(data.prev)) {
					return tabtab.log(Object.keys(propSchema), data);
				} else if (_.some(propertyCommands, (cmd) => {
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
									range = _.map(range, (value: { input }, key) => {
										return value.input || key;
									});
								}
								return tabtab.log(range, data);
							}
						}
					}
				}
				return tabtab.log(this.getAvailableCommands(), data);
			}
		});

		return true;
	}

	private getAvailableCommands(): string[] {
		var legacyCommandsNames = <_.List<string>>_.keys(this.commands);
		var commandsNames = <_.List<string>>$injector.getRegisteredCommandsNames();

		return _.union(legacyCommandsNames, commandsNames);
	}

	private makeCommand(module, command) {
		return () => {
			return require("./" + module)[command];
		};
	}
}
$injector.register("commandsService", CommandsService);

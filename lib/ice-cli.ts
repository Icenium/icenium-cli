///<reference path=".d.ts"/>
import Fiber = require("fibers");

(function() {
	"use strict";
	require("./extensions");
	require("./bootstrap");
	var util = require("util");
	var options = require("./options");

	function getCommandsService():ICommandsService {
		return $injector.resolve("commandsService");
	}

	function dispatchCommandInFiber() {
		Fiber(dispatchCommand).run();
	}

	function dispatchCommand() {
		var commandName = getCommandName();
		var commandArguments = getCommandArguments();

		if (!getCommandsService().executeCommand(commandName, commandArguments)) {
			require("./log").fatal("Unknown command '%s'. Use 'ice help' for help.", commandName);
		}

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

	if (process.argv[2] === "completion") {
		getCommandsService().completeCommand();
	} else {
		dispatchCommandInFiber();
	}
})();

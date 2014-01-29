///<reference path=".d.ts"/>
import Fiber = require("fibers");
import Future = require("fibers/future");

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
		var fiber = Fiber(dispatchCommand);
		global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
		fiber.run();
	}

	function dispatchCommand() {
		var commandName = getCommandName();
		var commandArguments = getCommandArguments();

		if (!getCommandsService().executeCommand(commandName, commandArguments)) {
			require("./log").fatal("Unknown command '%s'. Use 'ab help' for help.", commandName);
		}

		Future.assertNoFutureLeftBehind();
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

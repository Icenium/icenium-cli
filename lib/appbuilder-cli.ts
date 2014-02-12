///<reference path=".d.ts"/>
import Fiber = require("fibers");
import Future = require("fibers/future");
import path = require("path");

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
		var fiber = Fiber(() => {
			dispatchCommand();
			Future.assertNoFutureLeftBehind();
		});
		global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
		fiber.run();
	}

	function dispatchCommand() {
		if (options.version) {
			var $fs: IFileSystem = $injector.resolve("fs");
			var pkg: any = $fs.readJson(path.join(__dirname, "../package.json")).wait();
			console.log(pkg.version);
			return;
		}

		var commandName = getCommandName();
		var commandArguments = getCommandArguments();

		if (options.help) {
			commandArguments.unshift(commandName);
			commandName = "help";
		}

		if (!getCommandsService().executeCommand(commandName, commandArguments)) {
			$injector.resolve("logger").fatal("Unknown command '%s'. Use 'appbuilder help' for help.", commandName);
		}
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
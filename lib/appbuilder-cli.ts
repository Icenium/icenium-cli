///<reference path=".d.ts"/>

"use strict";

import Fiber = require("fibers");
import Future = require("fibers/future");
import path = require("path");
import util = require("util");
import queue = require("./queue");

require("./extensions");
require("./bootstrap");
import errors = require("./common/errors");

var options = require("./options");

errors.installUncaughtExceptionListener();

class CommandDispatcher {
	constructor(
		private $logger: ILogger,
		private $cancellation: ICancellationService,
		private $config: IConfiguration,
		private $commandsService: ICommandsService) {}

	public dispatchCommand() {

		this.$logger.setLoggerConfiguration(this.$config, options.log);

		if (options.version) {
			this.$logger.out(this.$config.version);
			return;
		}

		var commandName = this.getCommandName();
		var commandArguments = this.getCommandArguments();

		if (options.help) {
			commandArguments.unshift(commandName);
			commandName = "help";
		}

		this.$cancellation.begin("cli").wait();

		this.$commandsService.tryExecuteCommand(commandName, commandArguments);
	}

	public completeCommand(): void {
		this.$commandsService.completeCommand().wait();
	}

	private getCommandName(): string {
		var remaining: string[] = options._;
		if (remaining.length > 0) {
			return remaining[0].toLowerCase();
		}
		return "help";
	}

	private getCommandArguments(): string[] {
		var remaining: string[] = options._;
		if (remaining.length > 1) {
			return remaining.slice(1);
		}
		return [];
	}
}

class FutureDispatcher implements IFutureDispatcher {
	private actions: IQueue<any>

	public constructor(private $errors: IErrors) {
	}

	public run(): void {
		if (this.actions) {
			this.$errors.fail("You cannot run a running future dispatcher.")
		}
		this.actions = new queue.Queue<any>();

		while(true) {
			var action = this.actions.dequeue().wait();
			action().wait();
		}
	}

	public dispatch(action: () => IFuture<void>) {
		this.actions.enqueue(action);
	}
}
$injector.register("dispatcher", FutureDispatcher, false);

var fiber = Fiber(() => {
	var commandDispatcher = $injector.resolve(CommandDispatcher);
	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand();
	} else {
		commandDispatcher.dispatchCommand();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
});
global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
fiber.run();

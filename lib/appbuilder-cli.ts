///<reference path=".d.ts"/>
"use strict";

require("./common/extensions");
require("./bootstrap");
import errors = require("./common/errors");

import Fiber = require("fibers");
import Future = require("fibers/future");

var fiber = Fiber(() => {
	var analyticsService = $injector.resolve("analyticsService");

	var action = (err: Error, callstack: string) => {
		try {
			analyticsService.trackException(err, callstack);
		} catch (e) {
			console.log("Error while reporting exception: " + e);
		}
	};

	errors.installUncaughtExceptionListener(action);

	var commandDispatcher:ICommandDispatcher = $injector.resolve("commandDispatcher");

	var beforeExecuteCommandHook = (command:ICommand, commandName:string) => {
		if (!command.disableAnalytics) {
			analyticsService.checkConsent(commandName).wait();
			analyticsService.trackFeature(commandName).wait();
		}
	}

	if (process.argv[2] === "completion") {
		var getPropSchemaAction = () => {
			var project:any = $injector.resolve("project");
			var propSchema = undefined;
			if (project.projectData && project.projectType) {
				propSchema = require("./helpers").getProjectFileSchema(project.projectType).wait();
			}

			return propSchema;
		};

		commandDispatcher.completeCommand(getPropSchemaAction);
	} else {
		commandDispatcher.dispatchCommand(beforeExecuteCommandHook).wait();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
});

global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
fiber.run();

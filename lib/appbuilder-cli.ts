///<reference path=".d.ts"/>

require("./common/extensions");
require("./bootstrap");
import errors = require("./common/errors");

import Fiber = require("fibers");
import Future = require("fibers/future");

errors.installUncaughtExceptionListener();

var fiber = Fiber(() => {
	var commandDispatcher:ICommandDispatcher = $injector.resolve("commandDispatcher");
	commandDispatcher.setConfiguration($injector.resolve("config"));

	var beforeExecuteCommandHook = (command:ICommand, commandName:string) => {
		if (!command.disableAnalytics) {
			var analyticsService = $injector.resolve("analyticsService");
			analyticsService.checkConsent(commandName).wait();
			analyticsService.trackFeature(commandName).wait();
		}
	}

	if (process.argv[2] === "completion") {
		var project: any = $injector.resolve("project");
		var propSchema = undefined;
		if(project.projectData && project.projectType) {
			propSchema = require("./helpers").getProjectFileSchema(project.projectType).wait();
		}

		commandDispatcher.completeCommand(propSchema);
	} else {
		commandDispatcher.dispatchCommand(beforeExecuteCommandHook).wait();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
});

global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
fiber.run();

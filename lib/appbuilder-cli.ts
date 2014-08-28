///<reference path=".d.ts"/>
"use strict";

import path=require("path");
require("./common/extensions");
require("./bootstrap");
import errors = require("./common/errors");
import Fiber = require("fibers");
import Future = require("fibers/future");

var fiber = Fiber(() => {
	errors.installUncaughtExceptionListener();

	var commandDispatcher:ICommandDispatcher = $injector.resolve("commandDispatcher");

	if (process.argv[2] === "completion") {
		var getPropSchemaAction = () => {
			var project:any = $injector.resolve("project");
			var propSchema:any = undefined;
			if (project.projectData && project.projectType) {
				propSchema = require("./helpers").getProjectFileSchema(project.projectType).wait();
			}

			return propSchema;
		};

		commandDispatcher.completeCommand(["build", "deploy"], ["android, ios, wp8"], getPropSchemaAction).wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}

	$injector.dispose();
	Future.assertNoFutureLeftBehind();
});

global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
fiber.run();

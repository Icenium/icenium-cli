///<reference path=".d.ts"/>

require("./common/extensions");
require("./bootstrap");
import errors = require("./common/errors");

import Fiber = require("fibers");
import Future = require("fibers/future");

errors.installUncaughtExceptionListener();

var fiber = Fiber(() => {
	var commandDispatcher = $injector.resolve("commandDispatcher");
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

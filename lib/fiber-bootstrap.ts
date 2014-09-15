import Fiber = require("fibers");
import Future = require("fibers/future");
import errors = require("./common/errors");

export function run(action: Function) {
	var fiber = Fiber(() => {
		errors.installUncaughtExceptionListener();
		action();
		$injector.dispose();
		Future.assertNoFutureLeftBehind();
	});

	global.__main_fiber__ = fiber; // leak fiber to prevent it from being GC'd and thus corrupting V8
	fiber.run();
}


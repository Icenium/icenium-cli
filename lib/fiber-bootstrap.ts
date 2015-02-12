import Fiber = require("fibers");
import Future = require("fibers/future");
import errors = require("./common/errors");

export function run(action: Function) {
	Fiber(() => {
		errors.installUncaughtExceptionListener();
		action();
		$injector.dispose();
		Future.assertNoFutureLeftBehind();
	}).run();
}


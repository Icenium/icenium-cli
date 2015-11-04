///<reference path=".d.ts"/>
"use strict";

// this call must be first to avoid requiring c++ dependencies
require("./common/verify-node-version").verifyNodeVersion(require("../package.json").engines.node);

require("./bootstrap");
import fiberBootstrap = require("./common/fiber-bootstrap");
import {installUncaughtExceptionListener} from "./common/errors";
installUncaughtExceptionListener(process.exit);

fiberBootstrap.run(() => {
	let commandDispatcher:ICommandDispatcher = $injector.resolve("commandDispatcher");

	let config: Config.IConfig = $injector.resolve("$config");
	let errors: IErrors = $injector.resolve("$errors");
	errors.printCallStack = config.DEBUG;

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand().wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}
});

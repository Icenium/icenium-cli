///<reference path=".d.ts"/>
"use strict";

// this call must be first to avoid requiring c++ dependencies
require("./common/verify-node-version").verifyNodeVersion(require("../package.json").engines.node);

require("./bootstrap");
import fiberBootstrap = require("./common/fiber-bootstrap");
import * as shelljs from "shelljs";
shelljs.config.silent = true;
import {installUncaughtExceptionListener} from "./common/errors";
installUncaughtExceptionListener(process.exit);

fiberBootstrap.run(() => {
	let commandDispatcher:ICommandDispatcher = $injector.resolve("commandDispatcher");

	let config: Config.IConfig = $injector.resolve("$config");
	let errors: IErrors = $injector.resolve("$errors");
	errors.printCallStack = config.DEBUG;

	let messages = <IMessagesService>$injector.resolve("$messagesService");
	messages.pathsToMessageJsonFiles = [/* Place client-specific json message file paths here */];

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand().wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}
});

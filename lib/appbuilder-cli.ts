///<reference path=".d.ts"/>
"use strict";

require("./bootstrap");
import fiberBootstrap = require("./fiber-bootstrap");
fiberBootstrap.run(() => {
	let commandDispatcher:ICommandDispatcher = $injector.resolve("commandDispatcher");

	let config = <Config.IConfig>$injector.resolve("$config");
	let errors = <IErrors>$injector.resolve("$errors");
	errors.printCallStack = config.DEBUG;

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand().wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}
});

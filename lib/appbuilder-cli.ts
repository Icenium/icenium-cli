///<reference path=".d.ts"/>
"use strict";

require("./bootstrap");
import fiberBootstrap = require("./fiber-bootstrap");
fiberBootstrap.run(() => {
	var commandDispatcher:ICommandDispatcher = $injector.resolve("commandDispatcher");

	if (process.argv[2] === "completion") {
		commandDispatcher.completeCommand().wait();
	} else {
		commandDispatcher.dispatchCommand().wait();
	}
});

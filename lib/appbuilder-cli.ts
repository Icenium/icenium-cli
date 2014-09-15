///<reference path=".d.ts"/>
"use strict";

require("./bootstrap");
import fiberBootstrap = require("./fiber-bootstrap");
fiberBootstrap.run(() => {
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
});

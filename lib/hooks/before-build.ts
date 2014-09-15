///<reference path="../.d.ts"/>
"use strict";

require("./../bootstrap");
import fiberBootstrap = require("./../fiber-bootstrap");
fiberBootstrap.run(() => {
	$injector.require("typescriptCompilationService", "./services/typescript-compilation-service");
	$injector.resolve("typescriptCompilationService").compileAllProjectFiles().wait();
});



///<reference path="../.d.ts"/>
"use strict";

require("./../bootstrap");
import fiberBootstrap = require("./../fiber-bootstrap");
fiberBootstrap.run(() => {
	$injector.require("typeScriptCompilationService", "./common/services/typescript-compilation-service");
	let project: Project.IProject = $injector.resolve("project");
	project.ensureProject();

	let typeScriptFiles = project.getTypeScriptFiles().wait();
	if(typeScriptFiles.typeScriptFiles.length > typeScriptFiles.definitionFiles.length) { // We need this check because some of non-typescript templates(for example KendoUI.Strip) contain typescript definition files
		let typeScriptCompilationService = $injector.resolve("typeScriptCompilationService");
		typeScriptCompilationService.initialize(typeScriptFiles.typeScriptFiles, typeScriptFiles.definitionFiles);
		typeScriptCompilationService.compileAllFiles().wait();
	}
});

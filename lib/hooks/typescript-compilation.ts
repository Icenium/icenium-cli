///<reference path="../.d.ts"/>
"use strict";

require("./../bootstrap");
import * as path from "path";
import fiberBootstrap = require("./../common/fiber-bootstrap");
fiberBootstrap.run(() => {
	$injector.require("typeScriptCompilationService", "./common/services/typescript-compilation-service");
	let project: Project.IProject = $injector.resolve("project");
	if (!project.projectData) {
		return;
	}

	let typeScriptFiles = project.getTypeScriptFiles().wait();
	if (typeScriptFiles.typeScriptFiles.length > typeScriptFiles.definitionFiles.length) { // We need this check because some of non-typescript templates(for example KendoUI.Strip) contain typescript definition files
		let typeScriptCompilationService: ITypeScriptCompilationService = $injector.resolve("typeScriptCompilationService");
		let $fs: IFileSystem = $injector.resolve("fs");
		let pathToTsConfig = path.join(project.getProjectDir().wait(), "tsconfig.json");
		if ($fs.exists(pathToTsConfig).wait()) {
			let json = $fs.readJson(pathToTsConfig).wait();
			typeScriptCompilationService.compileWithDefaultOptions({ noEmitOnError: !!(json && json.compilerOptions && json.compilerOptions.noEmitOnError) }).wait();
		} else {
			typeScriptCompilationService.compileFiles({ noEmitOnError: false }, typeScriptFiles.typeScriptFiles, typeScriptFiles.definitionFiles).wait();
		}
	}
});

///<reference path="../.d.ts"/>
"use strict";
import path = require("path");

require("./../bootstrap");
import fiberBootstrap = require("./../fiber-bootstrap");
fiberBootstrap.run(() => {
	$injector.require("typeScriptCompilationService", "./common/services/typescript-compilation-service");

	let project: Project.IProject = $injector.resolve("project");
	let $fs: IFileSystem = $injector.resolve("fs");
	project.ensureProject();
	let projectFiles = $fs.enumerateFilesInDirectorySync(project.getProjectDir().wait());

	let typeScriptFiles = _.filter(projectFiles, file => path.extname(file) === ".ts");
	let definitionFiles = _.filter(typeScriptFiles, file => _.endsWith(file, ".d.ts"));
	if(typeScriptFiles.length > definitionFiles.length) { // We need this check because some of non-typescript templates(for example KendoUI.Strip) contain typescript definition files
		let typeScriptCompilationService = $injector.resolve("typeScriptCompilationService");
		typeScriptCompilationService.initialize(typeScriptFiles, definitionFiles);
		typeScriptCompilationService.compileAllFiles().wait();
	}
});

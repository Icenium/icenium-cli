require("./../bootstrap");
import * as path from "path";
import fiberBootstrap = require("./../common/fiber-bootstrap");
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/constants";

fiberBootstrap.run(() => {
	let $project: Project.IProject = $injector.resolve("project");
	if (!$project.projectData) {
		return;
	}

	let $projectConstants: Project.IConstants = $injector.resolve("projectConstants");
	let $typeScriptService: ITypeScriptService = $injector.resolve("typeScriptService");
	let typeScriptFiles = $typeScriptService.getTypeScriptFiles($project.getProjectDir().wait()).wait();

	if ($typeScriptService.isTypeScriptProject($project.projectDir).wait()) {
		let $fs: IFileSystem = $injector.resolve("fs");
		let pathToTsConfig = path.join($project.projectDir, $projectConstants.TSCONFIG_JSON_NAME);

		if ($project.projectData.Framework.toLowerCase() === TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()) {
			let $projectMigrationService: Project.IProjectMigrationService = $injector.resolve("projectMigrationService");
			$projectMigrationService.migrateTypeScriptProject().wait();
			let $npmService: INpmService = $injector.resolve("npmService");
			$npmService.install($project.projectDir).wait();
		}

		let useLocalTypeScriptCompiler = true;
		if ($fs.exists(pathToTsConfig).wait()) {
			let json = $fs.readJson(pathToTsConfig).wait();
			let noEmitOnError = !!(json && json.compilerOptions && json.compilerOptions.noEmitOnError);
			$typeScriptService.transpile($project.getProjectDir().wait(), null, null, { compilerOptions: { noEmitOnError }, useLocalTypeScriptCompiler }).wait();
		} else {
			let $resources: IResourceLoader = $injector.resolve("resources");
			let pathToDefaultDefinitionFiles = $resources.resolvePath(path.join("resources", "typescript-definitions-files"));
			let transpileOptions = { compilerOptions: { noEmitOnError: false }, pathToDefaultDefinitionFiles, useLocalTypeScriptCompiler };

			$typeScriptService.transpile($project.projectDir, typeScriptFiles.typeScriptFiles, typeScriptFiles.definitionFiles, transpileOptions).wait();
		}
	}
});

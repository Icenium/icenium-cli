import * as path from "path";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/constants";

module.exports = () => {
	let $project: Project.IProject = $injector.resolve("project");
	if (!$project.projectData) {
		return;
	}

	let $projectConstants: Project.IConstants = $injector.resolve("projectConstants");
	let $typeScriptService: ITypeScriptService = $injector.resolve("typeScriptService");
	let typeScriptFilesData = await  $typeScriptService.getTypeScriptFilesData($project.getProjectDir());

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
		if ($fs.exists(pathToTsConfig)) {
			let json = $fs.readJson(pathToTsConfig);
			let noEmitOnError = !!(json && json.compilerOptions && json.compilerOptions.noEmitOnError);
			$typeScriptService.transpile($project.getProjectDir(), null, null, { compilerOptions: { noEmitOnError }, useLocalTypeScriptCompiler }).wait();
		} else {
			let $resources: IResourceLoader = $injector.resolve("resources");
			let pathToDefaultDefinitionFiles = $resources.resolvePath(path.join("resources", "typescript-definitions-files"));
			let transpileOptions = { compilerOptions: { noEmitOnError: false }, pathToDefaultDefinitionFiles, useLocalTypeScriptCompiler };

			$typeScriptService.transpile($project.projectDir, typeScriptFilesData.typeScriptFiles, typeScriptFilesData.definitionFiles, transpileOptions).wait();
		}
	}
};

require("./../bootstrap");
import * as path from "path";
import fiberBootstrap = require("./../common/fiber-bootstrap");
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/constants";

fiberBootstrap.run(() => {
	let project: Project.IProject = $injector.resolve("project");
	if (!project.projectData) {
		return;
	}

	let typeScriptService: ITypeScriptService = $injector.resolve("typeScriptService");
	let typeScriptFiles = typeScriptService.getTypeScriptFiles(project.getProjectDir().wait()).wait();

	if (typeScriptFiles.typeScriptFiles.length > typeScriptFiles.definitionFiles.length) { // We need this check because some of non-typescript templates(for example KendoUI.Strip) contain typescript definition files
		let $fs: IFileSystem = $injector.resolve("fs");
		let pathToTsConfig = path.join(project.getProjectDir().wait(), "tsconfig.json");

		if (project.projectData.Framework.toLowerCase() === TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()) {
			let $projectMigrationService: Project.IProjectMigrationService = $injector.resolve("projectMigrationService");
			$projectMigrationService.migrateTypeScriptProject().wait();
			let $npmService: INpmService = $injector.resolve("npmService");
			$npmService.install(project.projectDir).wait();
		}

		if ($fs.exists(pathToTsConfig).wait()) {
			let json = $fs.readJson(pathToTsConfig).wait();
			let noEmitOnError = !!(json && json.compilerOptions && json.compilerOptions.noEmitOnError);
			typeScriptService.transpileWithDefaultOptions(project.getProjectDir().wait(), { compilerOptions: { noEmitOnError } }).wait();
		} else {
			let pathToDefaultDefinitionFiles = path.join(__dirname, "../../resources/typescript-definitions-files");
			typeScriptService.transpile(project.getProjectDir().wait(), typeScriptFiles.typeScriptFiles, typeScriptFiles.definitionFiles, { compilerOptions: { noEmitOnError: false }, pathToDefaultDefinitionFiles }).wait();
		}
	}
});

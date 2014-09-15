///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");

export class TypescriptCompilationService {
	constructor(private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject) { }

	public compileAllProjectFiles(): IFuture<void> {
		return (() => {
			var projectFiles = this.$project.enumerateProjectFiles().wait();
			var typescriptFiles = _.filter(projectFiles, file => path.extname(file) === ".ts");

			if(typescriptFiles.length > 0) {
				// Create typescript command file
				var typescriptCommandsFilePath = path.join(this.$project.getTempDir().wait(), "tscommand.txt");
				this.$fs.writeFile(typescriptCommandsFilePath, typescriptFiles.join(' ')).wait();

				// Get the path to tsc
				var typescriptModuleFilePath = require.resolve("typescript");
				var typescriptModuleDirPath = path.dirname(typescriptModuleFilePath);
				var typescriptCompilerPath = path.join(typescriptModuleDirPath, "tsc");
				var typescriptCompilerVersion = this.$fs.readJson(path.join(typescriptModuleDirPath, "../", "package.json")).wait().version;

				// Log some messages
				this.$logger.out("Compiling...".yellow);
				_.each(typescriptFiles, file => {
					this.$logger.out(util.format("### Compile ", file).cyan);
				});
				this.$logger.out(util.format("Using tsc version ", typescriptCompilerVersion).cyan);

				var startTime = new Date().getTime();

				// Core compilation
				var output = this.$childProcess.spawnFromEvent("node", [typescriptCompilerPath, "@" + typescriptCommandsFilePath], "close", { throwError: false }).wait();
				if (output.code === 0) {
					var endTime = new Date().getTime();
					var time = (endTime - startTime) / 1000;

					this.$logger.out(util.format("\n Success: %ss for %s typescript files \n Done without errors.", time.toFixed(2), typescriptFiles.length).green);
				} else {
					this.$logger.out(output.stdout);
					this.$errors.fail("Compilation failed".red);
				}

				this.$fs.deleteFile(typescriptCommandsFilePath).wait();
			}
		}).future<void>()();
	}
}
$injector.register("typescriptCompilationService", TypescriptCompilationService);

///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");

export class TypescriptCompilationService {
	constructor(private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $config: IConfiguration) { }

	public compileAllProjectFiles(): IFuture<void> {
		return (() => {
			var projectFiles = this.$project.enumerateProjectFiles().wait();
			var typescriptFiles = _.filter(projectFiles, file => path.extname(file) === ".ts");

			if(typescriptFiles.length > 0) {
				// Create typescript command file
				var typescriptCommandsFilePath = path.join(this.$project.getTempDir().wait(), "tscommand.txt");
				var typescriptCompilerOptions = this.getTypescriptCompilerOptions().wait();
				this.$fs.writeFile(typescriptCommandsFilePath, typescriptFiles.concat(typescriptCompilerOptions).join(' ')).wait();

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

				// Core compilation
				try {
					this.runCompilation(typescriptCompilerPath, typescriptCommandsFilePath, typescriptFiles).wait();
				} finally {
					this.$fs.deleteFile(typescriptCommandsFilePath).wait();
				}
			}
		}).future<void>()();
	}

	private runCompilation(typescriptCompilerPath: string, typescriptCommandsFilePath: string, typescriptFiles: string[]): IFuture<void> {
		return (() => {
			var startTime = new Date().getTime();

			var output = this.$childProcess.spawnFromEvent("node", [typescriptCompilerPath, "@" + typescriptCommandsFilePath], "close", { throwError: false }).wait();
			if (output.code === 0) {
				var endTime = new Date().getTime();
				var time = (endTime - startTime) / 1000;

				this.$logger.out(util.format("\n Success: %ss for %s typescript files \n Done without errors.", time.toFixed(2), typescriptFiles.length).green);
			} else {
				this.$logger.out(output.stdout);
				this.$errors.fail("Compilation failed".red);
			}
		}).future<void>()();
	}

	private getTypescriptCompilerOptions(): IFuture<string[]> {
		return (() => {
			var compilerOptions: string[] = [];
			var options = this.$config.TYPESCRIPT_COMPILER_OPTIONS;

			// string options
			compilerOptions.push(options.targetVersion.toUpperCase());
			compilerOptions.push(options.module.toLowerCase());

			// Boolean options
			if(options.declaration) {
				compilerOptions.push("--declaration");
			}
			if(options.noImplicitAny) {
				compilerOptions.push("--noImplicitAny");
			}
			if(options.sourceMap) {
				compilerOptions.push("--sourcemap");
			}
			if(options.removeComments) {
				compilerOptions.push("--removeComments");
			}

			// Target options - TODO: read this options from .abproject file
			if(options.out) {
				compilerOptions.push("--out", options.out);
			}
			if(options.outDir) {
				if(options.out) {
					this.$logger.warn("WARNING: Option out and outDir should not be used together".magenta);
				}
				compilerOptions.push("--outDir", options.outDir);
			}
			if (options.sourceRoot) {
				compilerOptions.push('--sourceRoot', options.sourceRoot);
			}
			if (options.mapRoot) {
				compilerOptions.push('--mapRoot', options.mapRoot);
			}

			return compilerOptions;

		}).future<string[]>()();
	}
}
$injector.register("typescriptCompilationService", TypescriptCompilationService);

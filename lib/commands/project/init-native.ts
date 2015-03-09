///<reference path="../../.d.ts"/>
"use strict";

import InitProjectCommandBaseLib = require("./init-command-base");

export class InitNativeCommand extends InitProjectCommandBaseLib.InitProjectCommandBase {
	constructor($errors: IErrors,
		$project: Project.IProject,
		$fs: IFileSystem,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants) {
		super($project, $errors, $fs, $logger);
	}

	public execute(args: string[]): IFuture<void> {
		return this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
	}
}
$injector.registerCommand("init|native", InitNativeCommand);
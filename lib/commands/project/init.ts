///<reference path="../../.d.ts"/>
"use strict";

import InitProjectCommandBaseLib = require("./init-command-base");

export class InitCommand extends InitProjectCommandBaseLib.InitProjectCommandBase {
	constructor($project: Project.IProject,
				$errors: IErrors,
				$fs: IFileSystem,
				$logger: ILogger,
				private $projectConstants: Project.IProjectConstants) {
		super($project, $errors, $fs, $logger);
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(this.isProjectType("Apache Cordova").wait()) {
				this.$logger.info("Attempting to initialize Cordova project.");
				this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
			} else if(this.isProjectType("NativeScript").wait()) {
				this.$logger.info("Attempting to initialize NativeScript project.");
				this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
			} else if(this.isProjectType("Mobile Website").wait()) {
				this.$logger.info("Attempting to initialize MobileWebsite project.");
				this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite).wait();
			} else {
				this.$errors.fail("Cannot determine project type. Specify project type and try again.");
			}
		}).future<void>()();
	}
}
$injector.registerCommand("init|*unknown", InitCommand);
///<reference path="../../.d.ts"/>
"use strict";

import projectTypes = require("../../project-types");

export class PrintFrameworkVersionsCommand implements ICommand {
	constructor(private $cordovaMigrationService: ICordovaMigrationService,
		private $project: Project.IProject,
		private $logger: ILogger,
		private $errors: IErrors) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var supportedVersions: Server.FrameworkVersion[] = this.$cordovaMigrationService.getSupportedFrameworks().wait();

			if(this.$project.projectData) {
				this.$logger.info("Your project is using version " + this.$cordovaMigrationService.getDisplayNameForVersion(this.$project.projectData["FrameworkVersion"]).wait());
			}

			this.$logger.info("Supported versions are: ");
			_.each(supportedVersions, (sv: Server.FrameworkVersion) => {
				this.$logger.info(sv.DisplayName);
			});
		}).future<void>()();
	}

	public allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			this.$project.ensureCordovaProject();

			if(this.$project.projectType !== projectTypes.Cordova) {
				this.$errors.fail("This command is valid only for hybrid projects.");
			}

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("mobileframework|*print", PrintFrameworkVersionsCommand);

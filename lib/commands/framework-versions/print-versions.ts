///<reference path="../../.d.ts"/>
"use strict";

export class PrintFrameworkVersionsCommand implements ICommand {
	constructor(private $cordovaMigrationService: IFrameworkMigrationService,
		private $nativeScriptMigrationService: IFrameworkMigrationService,
		private $project: Project.IProject,
		private $logger: ILogger,
		private $errors: IErrors,
		private $projectConstants: Project.IProjectConstants) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let migrationService = this.$project.projectData.Framework === this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova ? this.$cordovaMigrationService : this.$nativeScriptMigrationService;
			let supportedVersions: Server.FrameworkVersion[] = migrationService.getSupportedFrameworks().wait();

			this.$logger.info("Your project is using version " + migrationService.getDisplayNameForVersion(this.$project.projectData.FrameworkVersion).wait());

			this.$logger.info("Supported versions are: ");
			_.each(supportedVersions, (sv: Server.FrameworkVersion) => {
				this.$logger.info(sv.DisplayName);
			});
		}).future<void>()();
	}

	public allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			this.$project.ensureProject();
			if(!this.$project.capabilities.canChangeFrameworkVersion) {
				this.$errors.failWithoutHelp(`This command is not applicable to ${this.$project.projectData.Framework} projects.`);
			}

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("mobileframework|*print", PrintFrameworkVersionsCommand);

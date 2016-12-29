import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../common/constants";

export class PrintFrameworkVersionsCommand implements ICommand {
	constructor(private $cordovaMigrationService: IFrameworkMigrationService,
		private $nativeScriptMigrationService: IFrameworkMigrationService,
		private $project: Project.IProject,
		private $logger: ILogger,
		private $errors: IErrors) { }

	public async execute(args: string[]): Promise<void> {
			let migrationService = this.$project.projectData.Framework === TARGET_FRAMEWORK_IDENTIFIERS.Cordova ? this.$cordovaMigrationService : this.$nativeScriptMigrationService;
			let supportedVersions: IFrameworkVersion[] = migrationService.getSupportedFrameworks();
			let projectFrameworkVersion = migrationService.getDisplayNameForVersion(this.$project.projectData.FrameworkVersion);
			if (projectFrameworkVersion) {
				this.$logger.info(`Your project is using version ${projectFrameworkVersion}`);
			}

			this.$logger.info("Supported versions are: ");
			_.each(supportedVersions, (sv: IFrameworkVersion) => {
				this.$logger.info(sv.displayName);
			});
	}

	public allowedParameters: ICommandParameter[] = [];

	public async canExecute(args: string[]): Promise<boolean> {
			if (args && args.length > 0) {
				this.$errors.fail("This command does not accept parameters.");
			}

			this.$project.ensureProject();
			if (!this.$project.capabilities.canChangeFrameworkVersion) {
				this.$errors.failWithoutHelp(`This command is not applicable to ${this.$project.projectData.Framework} projects.`);
			}

			return true;
	}
}
$injector.registerCommand(["mobileframework|*print", "prop|print|frameworkversion"], PrintFrameworkVersionsCommand);

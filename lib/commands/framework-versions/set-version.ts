import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../common/constants";

export class SetFrameworkVersionCommand implements ICommand {
	constructor(private $injector: IInjector,
		private $project: Project.IProject) { }

	public execute(args: string[]): IFuture<void> {
		return this.$project.updateProjectPropertyAndSave("set", "FrameworkVersion", args);
	}

	public allowedParameters: ICommandParameter[] = [this.$injector.resolve(MobileFrameworkCommandParameter)];
}
$injector.registerCommand(["mobileframework|set", "prop|set|frameworkversion"], SetFrameworkVersionCommand);

export class MobileFrameworkCommandParameter implements ICommandParameter {
	private static VERSION_REGEX = new RegExp("^(\\d+\\.){2}\\d+$");

	constructor(private $cordovaMigrationService: IFrameworkMigrationService,
		private $project: Project.IProject,
		private $errors: IErrors,
		private $nativeScriptMigrationService: IFrameworkMigrationService) { }

	public mandatory = true;

	public validate(value: string, errorMessage?: string): IFuture<boolean> {
		return (() => {
			this.$project.ensureProject();
			if(!this.$project.capabilities.canChangeFrameworkVersion) {
				this.$errors.failWithoutHelp(`You cannot change FrameworkVersion of '${this.$project.projectData.Framework}' project.`);
			}

			if(value.match(MobileFrameworkCommandParameter.VERSION_REGEX)) {
				let supportedVersions: string[];
				let migrationService = this.$project.projectData.Framework === TARGET_FRAMEWORK_IDENTIFIERS.Cordova ? this.$cordovaMigrationService : this.$nativeScriptMigrationService;
				supportedVersions = migrationService.getSupportedVersions();

				if(_.includes(supportedVersions, value)) {
					return true;
				}

				this.$errors.failWithoutHelp(`The value ${value} is not a supported version. Supported versions are: ${supportedVersions.join(", ")}`);
			}

			this.$errors.failWithoutHelp("Version is not in correct format. Correct format is <Major>.<Minor>.<Patch>, for example '3.5.0'.");
		}).future<boolean>()();
	}
}

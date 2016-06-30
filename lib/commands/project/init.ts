import * as path from "path";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../common/constants";

class FileDescriptor {
	constructor(public path: string, public type: string) { }
}

export class InitProjectCommand implements ICommand {
	private cordovaFiles: FileDescriptor[];
	public projectDir: string;
	public tnsModulesDir: FileDescriptor;
	public indexHtml: FileDescriptor;
	public packageJson: FileDescriptor;
	public projectFilesDescriptors: any;

	constructor(private $project: Project.IProject,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectConstants: Project.IConstants) {

		this.projectDir = $project.getNewProjectDir();
		this.tnsModulesDir = new FileDescriptor(path.join(this.projectDir, "app", "tns_modules"), "directory");
		this.indexHtml = new FileDescriptor(path.join(this.projectDir, "index.html"), "file");
		this.cordovaFiles = _.map(this.$mobileHelper.platformNames, platform => new FileDescriptor(`cordova.${platform}.js`.toLowerCase(), "file"));
		this.packageJson = new FileDescriptor(path.join(this.projectDir, this.$projectConstants.PACKAGE_JSON_NAME), "file");

		this.generateMandatoryAndForbiddenFiles();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(this.isProjectType(TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait()) {
				this.$logger.info("Attempting to initialize Cordova project.");
				this.$project.initializeProjectFromExistingFiles(TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
			} else if(this.isProjectType(TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait()) {
				this.$logger.info("Attempting to initialize NativeScript project.");
				this.$project.initializeProjectFromExistingFiles(TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
			} else {
				this.$errors.fail("Cannot determine project type. Specify project type and try again.");
			}
		}).future<void>()();
	}

	private isProjectType(projectType: string): IFuture<boolean> {
		return (() => {
			let result = true;
			let projectData = this.projectFilesDescriptors[projectType];

			_.each(projectData.mandatoryFiles, (file: FileDescriptor) => {
				if(!this.$fs.exists(file.path).wait()) {
					this.$logger.trace("Missing %s %s. The project type is not %s.", file.path, file.type, projectType);
					result = false;
					// break execution of _.each
					return false;
				}
			});

			if(result) {
				_.each(projectData.forbiddenFiles, (file: FileDescriptor) => {
					if(this.$fs.exists(file.path).wait()) {
						this.$logger.trace("Found %s %s. The project type is not %s.", file.path, file.type, projectType);
						result = false;
						// break execution of _.each
						return false;
					}
				});
			}

			// Ionic projects are special, they lack cordova.platform.js files and have package.json. Deal with them here
			if (projectType === TARGET_FRAMEWORK_IDENTIFIERS.Cordova && !result) {
				result = this.$project.isIonicProject(this.projectDir).wait();
			}

			return result;
		}).future<boolean>()();
	}

	private generateMandatoryAndForbiddenFiles() {
		this.projectFilesDescriptors = Object.create(null);

		this.generateMandatoryAndForbiddenFilesCore(TARGET_FRAMEWORK_IDENTIFIERS.Cordova, this.cordovaFiles, [this.tnsModulesDir]);
		this.generateMandatoryAndForbiddenFilesCore(TARGET_FRAMEWORK_IDENTIFIERS.NativeScript, [this.packageJson], this.cordovaFiles.concat([this.indexHtml]));
	}

	private generateMandatoryAndForbiddenFilesCore(frameworkIdentifer: string, mandatoryFiles: FileDescriptor[], forbiddenFiles: FileDescriptor[]): void {
		this.projectFilesDescriptors[frameworkIdentifer] = {
			"mandatoryFiles": mandatoryFiles,
			"forbiddenFiles": forbiddenFiles
		};
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("init|*unknown", InitProjectCommand);

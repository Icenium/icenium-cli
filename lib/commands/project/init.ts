///<reference path="../../.d.ts"/>
"use strict";

import * as path from "path";
import * as util from "util";

class FileDescriptor {
	constructor(public path: string, public type: string) { }
}

export class InitProjectCommand implements ICommand {
	private cordovaFiles: FileDescriptor[];
	public projectDir: string;
	public tnsModulesDir: FileDescriptor;
	public indexHtml: FileDescriptor;
	public projectFilesDescriptors: any;

	constructor(private $project: Project.IProject,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectConstants: Project.IProjectConstants) {

		this.projectDir = $project.getNewProjectDir();
		this.tnsModulesDir = new FileDescriptor(path.join(this.projectDir, "app", "tns_modules"), "directory");
		this.indexHtml = new FileDescriptor(path.join(this.projectDir, "index.html"), "file");
		this.cordovaFiles = _.map(this.$mobileHelper.platformNames, platform => new FileDescriptor(util.format("cordova.%s.js", platform).toLowerCase(), "file"));

		this.generateMandatoryAndForbiddenFiles();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(this.isProjectType(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait()) {
				this.$logger.info("Attempting to initialize Cordova project.");
				this.$project.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
			} else if(this.isProjectType(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait()) {
				this.$logger.info("Attempting to initialize NativeScript project.");
				this.$project.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
			} else if(this.isProjectType(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite).wait()) {
				this.$logger.info("Attempting to initialize MobileWebsite project.");
				this.$project.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite).wait();
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

			return result;
		}).future<boolean>()();
	}

	private generateMandatoryAndForbiddenFiles() {
		this.projectFilesDescriptors = Object.create(null);

		this.generateMandatoryAndForbiddenFilesCore(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova, this.cordovaFiles, [this.tnsModulesDir]);
		this.generateMandatoryAndForbiddenFilesCore(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript, [this.tnsModulesDir], this.cordovaFiles.concat([this.indexHtml]));
		this.generateMandatoryAndForbiddenFilesCore(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite, [this.indexHtml], this.cordovaFiles.concat([this.tnsModulesDir]));
	}

	private generateMandatoryAndForbiddenFilesCore(frameworkIdentifer: string, manddatorFiles: FileDescriptor[], forbiddenFiles: FileDescriptor[]): void {
		this.projectFilesDescriptors[frameworkIdentifer] = {
			"mandatoryFiles": manddatorFiles,
			"forbiddenFiles": forbiddenFiles
		};
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("init|*unknown", InitProjectCommand);

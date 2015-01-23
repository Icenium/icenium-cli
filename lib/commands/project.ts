///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");
import MobileHelper = require("./../common/mobile/mobile-helper");

export class ProjectCommandBase implements ICommand {
	constructor(protected $project: Project.IProject,
		protected $errors: IErrors) {

		if (this.$project.projectData) {
			this.$errors.fail("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
		}
	}

	public enableHooks = false;

	public execute(args: string[]): IFuture<void> {
		return (() => {
			throw new Error("Unexpected error. Please, contact Telerik Support and provide the following error message for reference: 'ProjectCommandBase execute method has been called'.");
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];

	protected createNewProject(projectName: string, framework: string): IFuture<void> {
		return this.$project.createNewProject(projectName, framework);
	}

	protected initializeProjectFromExistingFiles(framework: string): IFuture<void> {
		return this.$project.initializeProjectFromExistingFiles(framework);
	}
}

export class FileDescriptor {
	constructor(public path: string, public type: string) { }
}

export class InitProjectCommandBase extends ProjectCommandBase {
	private cordovaFiles: FileDescriptor[];
	protected projectDir: string;
	protected tnsModulesDir: FileDescriptor;
	protected bootstrapFile: FileDescriptor;
	protected indexHtml: FileDescriptor;
	protected projectFilesDescriptors: any;

	constructor($project: Project.IProject,
		$errors: IErrors,
		protected $fs: IFileSystem,
		protected $logger: ILogger) {
		super($project, $errors);

		this.projectDir = $project.getNewProjectDir();
		this.tnsModulesDir = new FileDescriptor(path.join(this.projectDir, "tns_modules"), "directory");
		this.bootstrapFile = new FileDescriptor(path.join(this.projectDir, "app", "bootstrap.js"), "file");
		this.indexHtml = new FileDescriptor(path.join(this.projectDir, "index.html"), "file");
		this.cordovaFiles = _.map(Object.keys(MobileHelper.platformCapabilities), platform => {
			return new FileDescriptor(util.format("cordova.%s.js", platform).toLowerCase(), "file");
		});

		this.generateMandatoryAndForbiddenFiles();
	}

	protected isProjectType(projectType: string): IFuture<boolean> {
		return (() => {
			var result = true;
			var projectData = this.projectFilesDescriptors[projectType];

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
		this.projectFilesDescriptors = {
			"Apache Cordova": {
				"mandatoryFiles": this.cordovaFiles,
				"forbiddenFiles": [this.bootstrapFile, this.tnsModulesDir]
			},

			"NativeScript": {
				"mandatoryFiles": [this.bootstrapFile, this.tnsModulesDir],
			},

			"Mobile Website": {
				"mandatoryFiles": [this.indexHtml],
			}
		};

		this.projectFilesDescriptors["NativeScript"].forbiddenFiles = this.cordovaFiles.concat([this.indexHtml]);
		this.projectFilesDescriptors["Mobile Website"].forbiddenFiles = this.cordovaFiles.concat([this.bootstrapFile, this.tnsModulesDir]);
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			throw new Error("Unexpected error. Please, contact Telerik Support and provide the following error message for reference: 'InitProjectCommandBase execute method has been called'.");
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}

export class CreateHybridCommand extends ProjectCommandBase {
	constructor($errors: IErrors,
		$project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $jsonSchemaValidator: IJsonSchemaValidator) {
		super($project, $errors);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createNewProject(args[0], this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
	}

	allowedParameters = [new NameParameter(this.$jsonSchemaValidator)];
}
$injector.registerCommand("create|hybrid", CreateHybridCommand);

export class CreateNativeCommand extends ProjectCommandBase {
	constructor($errors: IErrors,
		$project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $jsonSchemaValidator: IJsonSchemaValidator) {
		super($project, $errors);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createNewProject(args[0], this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript);
	}

	allowedParameters = [new NameParameter(this.$jsonSchemaValidator)];
}
$injector.registerCommand("create|native", CreateNativeCommand);

export class CreateWebSiteCommand extends ProjectCommandBase {
	constructor($errors: IErrors,
		$project: Project.IProject,
		private $projectConstants: Project.IProjectConstants,
		private $jsonSchemaValidator: IJsonSchemaValidator) {
		super($project, $errors);
	}

	public execute(args: string[]): IFuture<void> {
		return this.createNewProject(args[0], this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite);
	}

	allowedParameters = [new NameParameter(this.$jsonSchemaValidator)];
}
$injector.registerCommand("create|website", CreateWebSiteCommand);

export class NameParameter implements ICommandParameter {
	constructor(private $jsonSchemaValidator: IJsonSchemaValidator) { }
	mandatory = true;
	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(validationValue) {
				this.$jsonSchemaValidator.validateProperty("ProjectName", validationValue);
				return true;
			}

			return false;
		}).future<boolean>()();
	}
}
$injector.register("nameCommandParameter", NameParameter);

export class InitCommand extends InitProjectCommandBase {
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
				this.$logger.info("Attempting to initialize Apache Cordova project.");
				this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova).wait();
			} else if(this.isProjectType("NativeScript").wait()) {
				this.$logger.info("Attempting to initialize  NativeScript project.");
				this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript).wait();
			} else if(this.isProjectType("Mobile Website").wait()) {
				this.$logger.info("Attempting to initialize Mobile Website project.");
				this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite).wait();
			} else {
				this.$errors.fail("Cannot determine project type. Specify project type and try again.");
			}
		}).future<void>()();
	}
}
$injector.registerCommand("init|*unknown", InitCommand);

export class InitHybridCommand extends InitProjectCommandBase {
	constructor($errors: IErrors,
		$project: Project.IProject,
		$fs: IFileSystem,
		$logger: ILogger,
		private $projectConstants: Project.IProjectConstants) {
		super($project, $errors, $fs, $logger);
	}

	public execute(args: string[]): IFuture<void> {
		return this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova);
	}
}
$injector.registerCommand("init|hybrid", InitHybridCommand);

export class InitNativeCommand extends InitProjectCommandBase {
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

export class InitWebsiteCommand extends InitProjectCommandBase {
	constructor($errors: IErrors,
	$project: Project.IProject,
	$fs: IFileSystem,
	$logger: ILogger,
	private $projectConstants: Project.IProjectConstants) {
		super($project, $errors, $fs, $logger);
	}

	public execute(args: string[]): IFuture<void> {
		return this.initializeProjectFromExistingFiles(this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite);
	}
}
$injector.registerCommand("init|website", InitWebsiteCommand);

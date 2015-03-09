///<reference path="../../.d.ts"/>
"use strict";

import path = require("path");
import util = require("util");
import MobileHelper = require("./../../common/mobile/mobile-helper");
import ProjectCommandBaseLib = require("./project-command-base");

class FileDescriptor {
	constructor(public path: string, public type: string) { }
}

export class InitProjectCommandBase extends ProjectCommandBaseLib.ProjectCommandBase {
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
		super($project, $errors, $logger);

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
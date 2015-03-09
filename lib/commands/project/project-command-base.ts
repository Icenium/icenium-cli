///<reference path="../../.d.ts"/>
"use strict";

export class ProjectCommandBase implements ICommand {
	constructor(protected $project: Project.IProject,
	protected $errors: IErrors,
	protected $logger: ILogger) {
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
		return (() => {
			this.$project.initializeProjectFromExistingFiles(framework).wait();
			this.$logger.out("Successfully initialized %s project.", framework);
		}).future<void>()();
	}
}
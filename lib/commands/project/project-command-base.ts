///<reference path="../../.d.ts"/>
"use strict";

export class ProjectCommandBase {
	constructor(protected $errors: IErrors,
		protected $project: Project.IProject) { }

	protected canExecuteCore(): IFuture<boolean> {
		return (() => {
			if (this.$project.projectData) {
				this.$errors.failWithoutHelp("Cannot create project in this location because the specified directory is part of an existing project. Switch to or specify another location and try again.");
			}

			return true;
		}).future<boolean>()();
	}
}
"use strict";

import Future = require("fibers/future");
import assert = require("assert");

export class EnsureProjectCommand implements ICommand {
	constructor(protected $project: Project.IProject,
		protected $errors: IErrors) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		assert.fail("","", "You should never get here. Please contact Telerik support and send the output of your command, executed with `--log trace`.");
		return Future.fromResult();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			this.$project.ensureProject();
			return true;
		}).future<boolean>()();
	}
}

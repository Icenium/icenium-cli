///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import assert = require("assert");

class BuildCommandBase implements ICommand {
	constructor(private $project: Project.IProject,
		private $errors: IErrors) { }
	
	allowedParameters: ICommandParameter[] = [];
	
	execute(args: string[]): IFuture<void> {
		assert.fail("","", "You should never get here. Please contact Telerik support and send the output of your command, executed with `--log trace`.");
		return Future.fromResult();
	}
	
	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			this.$project.ensureProject();
			if(args.length) {
				this.$errors.fail("This command doesn't accept parameters.");
			}
			return true;
		}).future<boolean>()();
	}
}
export class BuildAndroidCommand extends BuildCommandBase {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) { super($project, $errors) }

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.Android);
	}
}
$injector.registerCommand("build|android", BuildAndroidCommand);

export class BuildIosCommand extends BuildCommandBase {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) { super($project, $errors) }

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.iOS);
	}
}
$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildWP8Command extends BuildCommandBase {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) { super($project, $errors) }

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.WP8);
	}
}
$injector.registerCommand("build|wp8", BuildWP8Command);

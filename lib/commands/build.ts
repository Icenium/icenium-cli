///<reference path="../.d.ts"/>
"use strict";

import { EnsureProjectCommand } from "./ensure-project-command";

class BuildCommandBase extends EnsureProjectCommand {
	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			super.canExecute(args).wait();
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
		$errors: IErrors,
		private $options: IOptions) {
			super($project, $errors);
		}

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.Android);
	}
}
$injector.registerCommand("build|android", BuildAndroidCommand);

export class BuildIosCommand extends BuildCommandBase {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
			super($project, $errors);
		}

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.iOS, { buildForiOSSimulator: this.$options.emulator });
	}
}
$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildWP8Command extends BuildCommandBase {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors,
		private $options: IOptions,
		private $config: Config.IConfig) {
			super($project, $errors);
		}

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.WP8);
	}

	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand("build|wp8", BuildWP8Command);

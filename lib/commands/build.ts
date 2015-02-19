///<reference path="../.d.ts"/>
"use strict";

import MobileHelper = require("../common/mobile/mobile-helper");

export class BuildAndroidCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.Android]);
	}
}
$injector.registerCommand("build|android", BuildAndroidCommand);

export class BuildIosCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.iOS]);
	}
}
$injector.registerCommand("build|ios", BuildAndroidCommand);

export class BuildWP8Command implements ICommand {
	constructor(private $buildService: Project.IBuildService) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.WP8]);
	}
}
$injector.registerCommand("build|wp8", BuildAndroidCommand);

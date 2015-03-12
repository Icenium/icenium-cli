///<reference path="../.d.ts"/>
"use strict";

export class BuildAndroidCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.Android);
	}
}
$injector.registerCommand("build|android", BuildAndroidCommand);

export class BuildIosCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.iOS);
	}
}
$injector.registerCommand("build|ios", BuildIosCommand);

export class BuildWP8Command implements ICommand {
	constructor(private $buildService: Project.IBuildService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	allowedParameters: ICommandParameter[] = [];

	execute(args: string[]): IFuture<void> {
		return this.$buildService.executeBuild(this.$devicePlatformsConstants.WP8);
	}
}
$injector.registerCommand("build|wp8", BuildWP8Command);

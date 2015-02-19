///<reference path="../.d.ts"/>
"use strict";

import MobileHelper = require("../common/mobile/mobile-helper");

class AppManagerUploadAndroidCommand implements ICommand {
	constructor(private $appManagerService: IAppManagerService) { }

	execute(args: string[]): IFuture<void> {
		return this.$appManagerService.upload(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.Android].toLowerCase());
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|upload|android", AppManagerUploadAndroidCommand);

class AppManagerUploadIosCommand implements ICommand {
	constructor(private $appManagerService: IAppManagerService) { }

	execute(args: string[]): IFuture<void> {
		return this.$appManagerService.upload(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.iOS]);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|upload|ios", AppManagerUploadIosCommand);

class AppManagerUploadWP8Command implements ICommand {
	constructor(private $appManagerService: IAppManagerService) { }

	execute(args: string[]): IFuture<void> {
		return this.$appManagerService.upload(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.WP8]);
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|upload|wp8", AppManagerUploadWP8Command);

///<reference path="../.d.ts"/>
"use strict";

class AppManagerUploadAndroidCommand implements ICommand {
	constructor(private $appManagerService: IAppManagerService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	execute(args: string[]): IFuture<void> {
		return this.$appManagerService.upload(this.$devicePlatformsConstants.Android.toLowerCase());
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|upload|android", AppManagerUploadAndroidCommand);

class AppManagerUploadIosCommand implements ICommand {
	constructor(private $appManagerService: IAppManagerService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	execute(args: string[]): IFuture<void> {
		return this.$appManagerService.upload(this.$devicePlatformsConstants.iOS.toLowerCase());
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|upload|ios", AppManagerUploadIosCommand);

class AppManagerUploadWP8Command implements ICommand {
	constructor(private $appManagerService: IAppManagerService,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	execute(args: string[]): IFuture<void> {
		return this.$appManagerService.upload(this.$devicePlatformsConstants.WP8.toLowerCase());
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|upload|wp8", AppManagerUploadWP8Command);

class AppManagerGetGroupsCommand implements ICommand {
	constructor(private $appManagerService: IAppManagerService) { }

	execute(args: string[]): IFuture<void> {
		return this.$appManagerService.getGroups();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|groups", AppManagerGetGroupsCommand);

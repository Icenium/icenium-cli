///<reference path="../.d.ts"/>
"use strict";

import Future = require("fibers/future");
import commandParams = require("../common/command-params");
import helpers = require("../common/helpers");

class Resource implements ICommand {
	constructor(private $imageService: IImageService) { }

	execute(args: string[]): IFuture<void> {
		return this.$imageService.printDefinitions();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("resource|*list", Resource);

class ResourceCreate implements ICommand {
	constructor(private $errors: IErrors,
		private $imageService: IImageService,
		private $options: IOptions) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			if (this.$options.icon && this.$options.splash) {
				this.$imageService.generateImages(this.$options.icon, Server.ImageType.Icon, this.$options.force).wait();
				this.$imageService.generateImages(this.$options.splash, Server.ImageType.SplashScreen, this.$options.force).wait();
			} else if (this.$options.icon) {
				this.$imageService.generateImages(this.$options.icon, Server.ImageType.Icon, this.$options.force).wait();
			} else if (this.$options.splash) {
				this.$imageService.generateImages(this.$options.splash, Server.ImageType.SplashScreen, this.$options.force).wait();
			} else if (!helpers.isInteractive()) {
				this.$errors.failWithoutHelp('Console is not interactive');
			} else {
				this.$imageService.promptForImageInformation(this.$options.force).wait();
			}
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand(["resource|create"], ResourceCreate);

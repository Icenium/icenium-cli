///<reference path="../.d.ts"/>
"use strict";

import commandParams = require("../common/command-params");

class GenerateIcon implements ICommand {
	constructor(private $imageService: IImageService,
		private $options: IOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	execute(args: string[]): IFuture<void> {
		return this.$imageService.generateImages(args[0], Server.ImageType.Icon, this.$options.force);
	}

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("No png image file specified.")];
}
$injector.registerCommand("generate|icon", GenerateIcon);

class GenerateSplashScreen implements ICommand {
	constructor(private $imageService: IImageService,
		private $options: IOptions,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	execute(args: string[]): IFuture<void> {
		return this.$imageService.generateImages(args[0], Server.ImageType.SplashScreen, this.$options.force);
	}

	allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("No png image file specified.")];
}
$injector.registerCommand(["generate|splashscreen", "generate|splash"], GenerateSplashScreen);

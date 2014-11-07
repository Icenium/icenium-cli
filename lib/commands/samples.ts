///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
var options: any = require("../options");

export class PrintSamplesInformationCommand implements ICommand {
	constructor(private $samplesService: ISamplesService) { }
	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$samplesService.printSamplesInformation().wait();
		}).future<void>()();
	}
	allowedParameters: ICommandParameter[] = []
}
$injector.registerCommand("sample|*list", PrintSamplesInformationCommand);

export class CloneSampleCommand implements ICommand {
	constructor(private $samplesService: ISamplesService,
		private $fs: IFileSystem,
		private $errors: IErrors) { }
	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$samplesService.cloneSample(args[0]).wait();
		}).future<void>()();
	}
	allowedParameters: ICommandParameter[] = [new CloneCommandParameter(this.$samplesService, this.$fs, this.$errors)]
}
$injector.registerCommand("sample|clone", CloneSampleCommand);

class CloneCommandParameter implements ICommandParameter {
	constructor(private $samplesService: ISamplesService,
		private $fs: IFileSystem,
		private $errors: IErrors) { }
	mandatory = true;
	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(validationValue) {
				var sampleName = <string>validationValue;
				var cloneTo = options.path || sampleName;
				if(this.$fs.exists(cloneTo).wait() && this.$fs.readDirectory(cloneTo).wait().length > 0) {
					this.$errors.fail("Cannot clone sample in the specified path. The directory %s is not empty. Specify an empty target directory and try again.", path.resolve(cloneTo));
				}

				return true;
			}

			return false;
		}).future<boolean>()();
	}
}

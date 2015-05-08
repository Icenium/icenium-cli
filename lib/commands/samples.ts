///<reference path="../.d.ts"/>
"use strict";

import path = require("path");
let options: any = require("../common/options");

export class PrintSamplesCommand implements ICommand {
	constructor(private $samplesService: ISamplesService,
		private frameworkIdentifier: string,
		private $config: IConfiguration) { }

	execute(args: string[]): IFuture<void> {
		return this.$samplesService.printSamplesInformation(this.frameworkIdentifier);
	}

	get isDisabled() {
		return this.$config.ON_PREM;
	}

	allowedParameters: ICommandParameter[] = []
}
$injector.registerCommand("sample|*list", $injector.resolve(PrintSamplesCommand, {frameworkIdentifier: ""}));

export class CloneSampleCommand implements ICommand {
	constructor(private $samplesService: ISamplesService,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $config: IConfiguration) { }

	execute(args: string[]): IFuture<void> {
		return this.$samplesService.cloneSample(args[0]);
	}

	get isDisabled() {
		return this.$config.ON_PREM;
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
				let sampleName = <string>validationValue;
				let cloneTo = options.path || sampleName;
				if(this.$fs.exists(cloneTo).wait() && this.$fs.readDirectory(cloneTo).wait().length > 0) {
					this.$errors.fail("Cannot clone sample in the specified path. The directory %s is not empty. Specify an empty target directory and try again.", path.resolve(cloneTo));
				}

				return true;
			}

			return false;
		}).future<boolean>()();
	}
}

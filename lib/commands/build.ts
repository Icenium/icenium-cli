///<reference path="../.d.ts"/>
"use strict";
import MobileHelper = require("./../common/mobile/mobile-helper");
import options = require("./../options");

export class BuildCommand implements ICommand {
	constructor(private $buildService: Project.IBuildService,
		private $project: Project.IProject,
		private $errors: IErrors) { }

	allowedParameters: ICommandParameter[] = [new PlatformCommandParameter(this.$project, this.$errors)];

	get completionData(): string[] {
		return _.map(MobileHelper.PlatformNames, (platformName: string) => platformName.toLowerCase());
	}

	execute(args: string[]): IFuture<void> {
		return	this.$buildService.executeBuild(args[0]);
	}
}
$injector.registerCommand("build", BuildCommand);

class PlatformCommandParameter implements ICommandParameter {
	constructor(private $project: Project.IProject,
		private $errors: IErrors) { }

	mandatory = true;

	validate(validationValue: string): IFuture<boolean> {
		return (() => {
			if(!validationValue) {
				return false;
			}

			this.$project.ensureProject();

			if(!this.$project.capabilities.build && !options.companion) {
				this.$errors.fail("You will be able to build %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			MobileHelper.validatePlatformName(validationValue, this.$errors);

			return true;
		}).future<boolean>()();
	}
}
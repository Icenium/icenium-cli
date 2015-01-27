///<reference path="../../.d.ts"/>
"use strict";
import helpers = require("./../../helpers");
import projectPropertyCommandBaseLib = require("./prop-command-base");

export class PrintProjectCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
	}

	execute(args:string[]): IFuture<void> {
		return	this.$project.printProjectProperty(args[0]);
	}

	allowedParameters:ICommandParameter[] = [new PrintProjectCommandParameter(this.$project)];
}
$injector.registerCommand("prop|print", PrintProjectCommand);

class PrintProjectCommandParameter implements ICommandParameter {
	constructor(private $project: Project.IProject) { }

	mandatory = false;

	validate(validationValue: string): IFuture<boolean> {
		return ((): boolean => {
			this.$project.ensureProject();

			return !!validationValue;

		}).future<boolean>()();
	}
}

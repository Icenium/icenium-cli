///<reference path="../../.d.ts"/>
"use strict";
import projectPropertyCommandBaseLib = require("./prop-command-base");

export class SetProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			var property = args[0];
			var propertyValues = _.rest(args, 1);
			if(this.$project.validateProjectProperty(property, propertyValues, "set").wait()) {
				if(propertyValues.length === 1 && propertyValues[0]) {
					return true;
				}
			}

			return false;
		}).future<boolean>()();
	}

	execute(args: string[]): IFuture<void> {
		return	this.$project.updateProjectPropertyAndSave("set", args[0], _.rest(args, 1));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|set", SetProjectPropertyCommand);
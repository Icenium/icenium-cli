///<reference path="../../.d.ts"/>
"use strict";
import projectPropertyCommandBaseLib = require("./prop-command-base");

export class RemoveProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(this.$project.validateProjectProperty(args[0], _.rest(args, 1), "del").wait()) {
				// there's at least one value passed to validateProjectProperty
				if(args[1]) {
					return true;
				}
			}
			return false;
		}).future<boolean>()();
	}

	execute(args: string[]): IFuture<void> {
		return this.$project.updateProjectPropertyAndSave("del", args[0], _.rest(args, 1));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|rm", RemoveProjectPropertyCommand);
$injector.registerCommand("prop|remove", RemoveProjectPropertyCommand);
///<reference path="../../.d.ts"/>
"use strict";
import * as ProjectPropertyCommandBaseLib from "./prop-command-base";

export class AddProjectPropertyCommand extends ProjectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(this.$project.validateProjectProperty(args[0], _.rest(args), "add").wait()) {
				// there's at least one value passed to validateProjectProperty
				if(args[1]) {
					return true;
				}
			}

			return false;
		}).future<boolean>()();
	}

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.updateProjectPropertyAndSave("add", args[0], _.rest(args, 1)).wait();
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|add", AddProjectPropertyCommand);

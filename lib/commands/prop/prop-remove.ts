import * as projectPropertyCommandBaseLib from "./prop-command-base";

export class RemoveProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	async canExecute(args: string[]): Promise<boolean> {
			if (await this.$project.validateProjectProperty(args[0], _.tail(args), "del")) {
				// there's at least one value passed to validateProjectProperty
				if(args[1]) {
					return true;
				}
			}
			return false;
	}

	async execute(args: string[]): Promise<void> {
		return this.$project.updateProjectPropertyAndSave("del", args[0], _.tail(args));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|rm", RemoveProjectPropertyCommand);
$injector.registerCommand("prop|remove", RemoveProjectPropertyCommand);

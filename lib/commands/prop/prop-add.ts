import * as ProjectPropertyCommandBaseLib from "./prop-command-base";

export class AddProjectPropertyCommand extends ProjectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	async canExecute(args: string[]): Promise<boolean> {
			if (await this.$project.validateProjectProperty(args[0], _.tail(args), "add")) {
				// there's at least one value passed to validateProjectProperty
				if(args[1]) {
					return true;
				}
			}

			return false;
	}

	async execute(args: string[]): Promise<void> {
			await this.$project.updateProjectPropertyAndSave("add", args[0], _.tail(args));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|add", AddProjectPropertyCommand);

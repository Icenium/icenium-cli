import * as ProjectPropertyCommandBaseLib from "./prop-command-base";

export class AddProjectPropertyCommand extends ProjectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (await this.$project.validateProjectProperty(args[0], _.tail(args), "add")) {
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
			await this.$project.updateProjectPropertyAndSave("add", args[0], _.tail(args));
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|add", AddProjectPropertyCommand);

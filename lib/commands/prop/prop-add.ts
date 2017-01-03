import * as ProjectPropertyCommandBaseLib from "./prop-command-base";
import { invokeInit } from "../../common/decorators";

export class AddProjectPropertyCommand extends ProjectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
	}

	@invokeInit()
	public async canExecute(args: string[]): Promise<boolean> {
		if (await this.$project.validateProjectProperty(args[0], _.tail(args), "add")) {
			// there's at least one value passed to validateProjectProperty
			if (args[1]) {
				return true;
			}
		}

		return false;
	}

	@invokeInit()
	public async execute(args: string[]): Promise<void> {
		await this.$project.updateProjectPropertyAndSave("add", args[0], _.tail(args));
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("prop|add", AddProjectPropertyCommand);

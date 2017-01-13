import * as projectPropertyCommandBaseLib from "./prop-command-base";
import { cache, invokeInit } from "../../common/decorators";

export class RemoveProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
	}

	@cache()
	public async init(): Promise<void> {
		await this.$project.ensureProject();
	}

	@invokeInit()
	public async canExecute(args: string[]): Promise<boolean> {
		if (await this.$project.validateProjectProperty(args[0], _.tail(args), "del")) {
			// there's at least one value passed to validateProjectProperty
			if (args[1]) {
				return true;
			}
		}
		return false;
	}

	@invokeInit()
	public async execute(args: string[]): Promise<void> {
		await this.$project.updateProjectPropertyAndSave("del", args[0], _.tail(args));
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("prop|rm", RemoveProjectPropertyCommand);
$injector.registerCommand("prop|remove", RemoveProjectPropertyCommand);

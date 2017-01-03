import projectPropertyCommandBaseLib = require("./prop-command-base");
import { invokeInit } from "../../common/decorators";

export class SetProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
	}

	@invokeInit()
	public async canExecute(args: string[]): Promise<boolean> {
		let property = args[0];
		let propertyValues = _.tail(args);
		return this.$project.validateProjectProperty(property, propertyValues, "set");
	}

	@invokeInit()
	public async execute(args: string[]): Promise<void> {
		await this.$project.updateProjectPropertyAndSave("set", args[0], _.tail(args));
	}

	public allowedParameters: ICommandParameter[] = [];
}

$injector.registerCommand("prop|set", SetProjectPropertyCommand);

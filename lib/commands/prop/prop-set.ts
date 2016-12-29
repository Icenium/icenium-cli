import projectPropertyCommandBaseLib = require("./prop-command-base");

export class SetProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	async canExecute(args: string[]): Promise<boolean> {
			let property = args[0];
			let propertyValues = _.tail(args);
			return this.$project.validateProjectProperty(property, propertyValues, "set");
	}

	async execute(args: string[]): Promise<void> {
		return	this.$project.updateProjectPropertyAndSave("set", args[0], _.tail(args));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|set", SetProjectPropertyCommand);

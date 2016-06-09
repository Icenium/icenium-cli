import projectPropertyCommandBaseLib = require("./prop-command-base");

export class SetProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	canExecute(args: string[]): IFuture<boolean> {
			let property = args[0];
			let propertyValues = _.rest(args, 1);
			return this.$project.validateProjectProperty(property, propertyValues, "set");
	}

	execute(args: string[]): IFuture<void> {
		return	this.$project.updateProjectPropertyAndSave("set", args[0], _.rest(args, 1));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|set", SetProjectPropertyCommand);

import projectPropertyCommandBaseLib = require("./prop-command-base");

export class SetProjectPropertyCommand extends projectPropertyCommandBaseLib.ProjectPropertyCommandBase implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector) {
		super($staticConfig, $injector);
		this.$project.ensureProject();
	}

	canExecute(args: string[]): IFuture<boolean> {
			let property = args[0];
			let propertyValues = _.tail(args);
			return this.$project.validateProjectProperty(property, propertyValues, "set");
	}

	execute(args: string[]): IFuture<void> {
		return	this.$project.updateProjectPropertyAndSave("set", args[0], _.tail(args));
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("prop|set", SetProjectPropertyCommand);

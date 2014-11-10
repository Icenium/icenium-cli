///<reference path="../../.d.ts"/>
"use strict";

export class DevConfigApplyCommand implements ICommand {
	constructor(private $config: IConfiguration,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameterBuilder.createMandatoryParameter("Specify dev environment to be applied")];
	public disableAnalytics = true;

	public execute(args: string[]): IFuture<void> {
		return this.$config.apply(args[0]);
	}
}
$injector.registerCommand("dev-config-apply", DevConfigApplyCommand);
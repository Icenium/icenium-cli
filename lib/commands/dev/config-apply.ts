///<reference path="../../.d.ts"/>
"use strict";
import commandParams = require("../../common/command-params");

export class DevConfigApplyCommand implements ICommand {
	constructor(private $config: IConfiguration) { }

	public allowedParameters: ICommandParameter[] = [new commandParams.StringCommandParameter(true)];
	public disableAnalytics = true;

	public execute(args: string[]): IFuture<void> {
		return this.$config.apply(args[0]);
	}
}
$injector.registerCommand("dev-config-apply", DevConfigApplyCommand);
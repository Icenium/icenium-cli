///<reference path="../../.d.ts"/>
"use strict";

export class DevConfigApplyCommand implements ICommand {
	constructor(private $config: IConfiguration) { }

	public disableAnalytics = true;

	public execute(args: string[]): IFuture<void> {
		return this.$config.apply(args[0]);
	}
}
$injector.registerCommand("dev-config-apply", DevConfigApplyCommand);
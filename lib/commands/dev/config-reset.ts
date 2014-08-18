///<reference path="../../.d.ts"/>
"use strict";

export class DevConfigResetCommand implements ICommand {
	constructor(private $config: IConfiguration) { }

	public disableAnalytics = true;

	public execute(args: string[]): IFuture<void> {
		return this.$config.reset();
	}
}
$injector.registerCommand("dev-config-reset", DevConfigResetCommand);
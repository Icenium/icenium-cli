///<reference path="../../.d.ts"/>
"use strict";

export class DevConfigCommand implements ICommand {
	allowedParameters: ICommandParameter[];

	constructor(private $config: IConfiguration) { }

	public execute(args: string[]): IFuture<void> {
		return this.$config.printConfigData();
	}
}
$injector.registerCommand("dev-config", DevConfigCommand);

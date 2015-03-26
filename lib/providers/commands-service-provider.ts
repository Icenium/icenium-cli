///<reference path="../.d.ts"/>
"use strict";

class CommandsServiceProvider implements ICommandsServiceProvider {
	constructor(public $screenBuilderService: IScreenBuilderService) { }

	public allDynamicCommands(): IFuture<string[]> {
		return this.$screenBuilderService.allSupportedCommands();
	}

	public generateDynamicCommands(): IFuture<void> {
		return this.$screenBuilderService.generateAllCommands("generator-kendo-ui-mobile");
	}
}
$injector.register("commandsServiceProvider", CommandsServiceProvider);
///<reference path="../.d.ts"/>
"use strict";

class CommandsServiceProvider implements ICommandsServiceProvider {
	constructor(private $projectCommandsService: IProjectCommandsService,
		private $screenBuilderService: IScreenBuilderService) { }

	public getDynamicCommands(): IFuture<string[]> {
		return this.$screenBuilderService.allSupportedCommands();
	}

	public generateDynamicCommands(): IFuture<void> {
		return this.$screenBuilderService.generateAllCommands(this.$screenBuilderService.generatorName);
	}

	public registerDynamicSubCommands(): void {
		this.$projectCommandsService.generateAllProjectCommands();
	}
}
$injector.register("commandsServiceProvider", CommandsServiceProvider);
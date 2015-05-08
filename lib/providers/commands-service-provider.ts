///<reference path="../.d.ts"/>
"use strict";

import initCommandLib = require("../commands/project/init-project");
import projectCommandLib = require("../commands/project/create-project");
import samplesLib =require("../commands/samples");
import util = require("util");

class CommandsServiceProvider implements ICommandsServiceProvider {
	private commands: IDynamicSubCommandInfo[];
	private mapCommandNameToFramework: IStringDictionary;

	constructor(private $injector: IInjector,
		private $screenBuilderService: IScreenBuilderService,
		private $projectConstants: Project.IProjectConstants) {

		this.mapCommandNameToFramework = {
			hybrid: this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova,
			native: this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript,
			website: this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite
		};

		this.commands = [
			{
				commandConstructor: projectCommandLib.CreateProjectCommand,
				baseCommandName: "create",
				filePath: "./commands/project/create-project"
			},
			{
				commandConstructor: initCommandLib.InitProjectCommand,
				baseCommandName: "init",
				filePath: "./commands/project/init-project"
			},
			{
				commandConstructor: samplesLib.PrintSamplesCommand,
				baseCommandName: "sample",
				filePath: "./commands/samples"
			}
		];
	}

	public get dynamicCommandsPrefix(): string {
		return this.$screenBuilderService.commandsPrefix;
	}

	public getDynamicCommands(): IFuture<string[]> {
		return this.$screenBuilderService.allSupportedCommands(this.$screenBuilderService.generatorName);
	}

	public generateDynamicCommands(): IFuture<void> {
		return this.$screenBuilderService.generateAllCommands(this.$screenBuilderService.generatorName);
	}

	public registerDynamicSubCommands(): void {
		_.each(this.commands, command => {
			this.registerDynamicSubCommand(command);
		});
	}

	private registerDynamicSubCommand(command: IDynamicSubCommandInfo): void {
		let subCommands = _.keys(this.mapCommandNameToFramework);
		_.each(subCommands, subCommand => {
			let resolver = this.$injector.resolve(command.commandConstructor, { frameworkIdentifier: this.mapCommandNameToFramework[subCommand] });
			let name = util.format("%s|%s", command.baseCommandName, subCommand);
			this.$injector.requireCommand(name, command.filePath);
			this.$injector.registerCommand(name, resolver);
		});
	}
}
$injector.register("commandsServiceProvider", CommandsServiceProvider);

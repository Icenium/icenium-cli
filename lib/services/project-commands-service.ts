///<reference path="../.d.ts"/>
"use strict";

import initCommandLib = require("../commands/project/init-project");
import projectCommandLib = require("../commands/project/create-project");
import util = require("util");

export class ProjectCommandsService implements IProjectCommandsService {
	private mapCommandNameToFramework: IStringDictionary;

	constructor(private $injector: IInjector,
		private $projectConstants: Project.IProjectConstants) {
		this.mapCommandNameToFramework = {
			hybrid: this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova,
			native: this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.NativeScript,
			website: this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.MobileWebsite
		};
	}

	public generateAllProjectCommands(): void {
		var commands = _.keys(this.mapCommandNameToFramework);
		_.each(commands, (commandName) => this.addProjectCommand("create", commandName, projectCommandLib.CreateProjectCommand));
		_.each(commands, (commandName) => this.addProjectCommand("init", commandName, initCommandLib.InitProjectCommand));
	}

	private addProjectCommand(baseCommandName: string, commandName: string, ctorResolver: Function): void {
		var resolver = this.$injector.resolve(ctorResolver, { frameworkIdentifier: this.mapCommandNameToFramework[commandName] });
		var name = util.format("%s|%s", baseCommandName, commandName);
		this.$injector.requireCommand(name, util.format("./commands/project/%s-project", baseCommandName));
		this.$injector.registerCommand(name, resolver);
	}
}
$injector.register("projectCommandsService", ProjectCommandsService);
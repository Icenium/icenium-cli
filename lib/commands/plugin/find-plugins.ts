///<reference path="../../.d.ts"/>
"use strict";

import service = require("../../services/cordova-plugins");
import util = require("util");
import os = require("os");

export class FindPluginsCommand implements ICommand {
	constructor(private $cordovaPluginsService: service.CordovaPluginsService,
				private $logger: ILogger) {
	}

	public allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			return true;
		}).future<boolean>()();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let plugins = this.$cordovaPluginsService.getPlugins(args);
			this.printPlugins(plugins);
		}).future<void>()();
	}

	private printPlugins(plugins: IBasicPluginInformation[]) {
		_.each(plugins, (plugin) => {
			let pluginDescription = this.composePluginDescription(plugin);
			this.$logger.info(pluginDescription);
		});
	}

	private composePluginDescription(plugin: IBasicPluginInformation) {
		let description = util.format("Name: %s%s", plugin.name, os.EOL);
		description += util.format("Description: %s%s", this.trim(plugin.description), os.EOL);
		description += util.format("Version: %s%s", plugin.version, os.EOL);
		return description;
	}

	private trim(content: string) {
		if (content) {
			return content.trim();
		}
		return undefined;
	}
}
$injector.registerCommand("plugin|find", FindPluginsCommand);

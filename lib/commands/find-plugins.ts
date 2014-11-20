///<reference path="../.d.ts"/>
"use strict";

import service = require("../services/cordova-plugins");
import util = require("util");
import os = require("os");

export class FindPluginsCommand implements ICommand {
	constructor(private $cordovaPluginsService: service.CordovaPluginsService) {
	}

	public allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			return true;
		}).future<boolean>()();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var plugins = this.$cordovaPluginsService.getPlugins(args);
			this.printPlugins(plugins);
		}).future<void>()();
	}

	private printPlugins(plugins: IPlugin[]) {
		_.each(plugins, (plugin) => {
			var pluginDescription = this.composePluginDescription(plugin);
			console.log(pluginDescription);
		});
	}

	private composePluginDescription(plugin: IPlugin) {
		var description = util.format("Name: %s%s", plugin.data.Name, os.EOL);
		description += util.format("Description: %s%s", this.trim(plugin.data.Description), os.EOL);
		description += util.format("Version: %s%s", plugin.data.Version, os.EOL);
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
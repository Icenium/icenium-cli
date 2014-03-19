///<reference path="../.d.ts"/>
"use strict";

import service = require("../services/cordova-plugins");
import util = require("util");
import os = require("os");

export class FindPluginsCommand implements ICommand {
	constructor(private $cordovaPluginsService: service.CordovaPluginsService) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var plugins = this.$cordovaPluginsService.getPlugins(args);
			this.printPlugins(plugins);
		}).future<void>()();
	}

	private printPlugins(plugins) {
		_.each(plugins, (plugin) => {
			var pluginDescription = this.composePluginDescription(plugin);
			console.log(pluginDescription);
		});
	}

	private composePluginDescription(plugin) {
		var description = util.format("Name: %s%s", plugin.name, os.EOL);
		description += util.format("Description: %s%s", this.trim(plugin.description), os.EOL);
		description += util.format("Version: %s%s", plugin.version, os.EOL);
		return description;
	}

	private trim(content) {
		if (content) {
			return content.trim();
		}
		return undefined;
	}
}
$injector.registerCommand("find-plugins", FindPluginsCommand);
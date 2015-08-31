///<reference path="../../.d.ts"/>
"use strict";

import * as service from "../../services/cordova-plugins";
import {EOL} from "os";

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
		let description = "Name: " + plugin.name + EOL +
			"Description: " + this.trim(plugin.description) + EOL +
			"Version: " + plugin.version + EOL;
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

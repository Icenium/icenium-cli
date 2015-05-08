///<reference path="../../.d.ts"/>
"use strict";

import options = require("../../common/options");

export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let plugins = options.available ? this.$pluginsService.getAvailablePlugins() : this.$pluginsService.getInstalledPlugins();
			this.$pluginsService.printPlugins(plugins);
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|*list", ListPluginCommand);
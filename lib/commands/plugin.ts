///<reference path="../.d.ts"/>
"use strict";
import options = require("./../options");

export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var plugins: IPlugin[] = [];
			if(options.available) {
				plugins = this.$pluginsService.getAvailablePlugins().wait();
			} else {
				plugins = this.$pluginsService.getInstalledPlugins().wait();
			}

			this.$pluginsService.printPlugins(plugins);
		}).future<void>()();
	}
}
$injector.registerCommand("plugin|*list", ListPluginCommand);

export class AddPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService) { }

	public execute(args: string[]): IFuture<void> {
		return this.$pluginsService.addPlugin(args[0]);
	}
}
$injector.registerCommand("plugin|add", AddPluginCommand);

export class RemovePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService) { }

	public execute(args: string[]): IFuture<void> {
		return this.$pluginsService.removePlugin(args[0]);
	}
}
$injector.registerCommand("plugin|remove", RemovePluginCommand);
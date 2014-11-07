///<reference path="../.d.ts"/>
"use strict";
import options = require("./../options");

export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var plugins = options.available ? this.$pluginsService.getAvailablePlugins() : this.$pluginsService.getInstalledPlugins();
			this.$pluginsService.printPlugins(plugins);
		}).future<void>()();
	}
}
$injector.registerCommand("plugin|*list", ListPluginCommand);

export class AddPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(options.available){
				var installedPlugins = this.$pluginsService.getInstalledPlugins();
				var plugins = _.reject(this.$pluginsService.getAvailablePlugins(), plugin => _.any(installedPlugins, installedPlugin => installedPlugin.name === plugin.name));
				this.$pluginsService.printPlugins(plugins);
			} else {
				this.$pluginsService.addPlugin(args[0]).wait();
			}
		}).future<void>()();
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
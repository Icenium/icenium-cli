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

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|*list", ListPluginCommand);

export class AddPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

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

	allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(options.available) {
				return true;
			}

			var pluginName = args[0];
			// Use pluginCommandParameter's validate method for verification.
			var pluginCommandParameter = new PluginCommandParameter(this.$pluginsService, this.$errors);
			pluginCommandParameter.validate(pluginName).wait();

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("plugin|add", AddPluginCommand);

export class RemovePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

	public execute(args: string[]): IFuture<void> {
		return this.$pluginsService.removePlugin(args[0]);
	}

	allowedParameters: ICommandParameter[] = [new PluginCommandParameter(this.$pluginsService, this.$errors)];
}
$injector.registerCommand("plugin|remove", RemovePluginCommand);

class PluginCommandParameter implements ICommandParameter {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

	mandatory = true;

	validate(pluginName: string): IFuture<boolean> {
		return (() => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			if(this.$pluginsService.isPluginInstalled(pluginName)) {
				this.$errors.fail("Plugin %s already exists", pluginName);
			}
		}).future<boolean>()();
	}
}

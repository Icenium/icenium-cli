///<reference path="../../.d.ts"/>
"use strict";

import options = require("./../../options");

export class AddPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
				private $injector: IInjector) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(options.available){
				var installedPlugins = this.$pluginsService.getInstalledPlugins();
				var plugins = _.reject(this.$pluginsService.getAvailablePlugins(), (plugin: IPlugin) => _.any(installedPlugins, (installedPlugin: IPlugin) => installedPlugin.data.Name === plugin.data.Name));
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
			var pluginCommandParameter = this.$injector.resolve(PluginCommandParameter);
			pluginCommandParameter.validate(pluginName).wait();

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("plugin|add", AddPluginCommand);

class PluginCommandParameter implements ICommandParameter {
	constructor(private $pluginsService: IPluginsService,
				private $errors: IErrors) { }

	mandatory = true;

	validate(pluginName: string): IFuture<boolean> {
		return ((): boolean => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			if(this.$pluginsService.isPluginInstalled(pluginName)) {
				this.$errors.fail("Plugin %s already exists", pluginName);
			}

			return true;
		}).future<boolean>()();
	}
}
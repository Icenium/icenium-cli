///<reference path="../../.d.ts"/>
"use strict";

export class ConfigurePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
				private $injector: IInjector) { }

	public execute(args: string[]): IFuture<void> {
		return this.$pluginsService.configurePlugin(args[0]);
	}

	allowedParameters: ICommandParameter[] = [this.$injector.resolve(PluginConfigureCommandParameter)];
}
$injector.registerCommand("plugin|configure", ConfigurePluginCommand);

class PluginConfigureCommandParameter implements ICommandParameter {
	constructor(private $pluginsService: IPluginsService,
				private $errors: IErrors) { }

	mandatory = true;

	validate(pluginName: string): IFuture<boolean> {
		return ((): boolean => {
			if(!pluginName) {
				this.$errors.fail("No plugin name specified");
			}

			if(!this.$pluginsService.isPluginInstalled(pluginName)) {
				this.$errors.fail("Plugin %s is not installed", pluginName);
			}

			return true;
		}).future<boolean>()();
	}
}
///<reference path="../../.d.ts"/>
"use strict";

export class PluginConfigureCommandParameter implements ICommandParameter {
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
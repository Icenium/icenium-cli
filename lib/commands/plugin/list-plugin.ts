///<reference path="../../.d.ts"/>
"use strict";

export class ListPluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $options: IOptions) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let plugins = this.$options.available ? this.$pluginsService.getAvailablePlugins() : this.$pluginsService.getInstalledPlugins();
			this.$pluginsService.printPlugins(plugins);
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("plugin|*list", ListPluginCommand);

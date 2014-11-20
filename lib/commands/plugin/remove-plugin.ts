///<reference path="../../.d.ts"/>
"use strict";
import pluginConfigureCommandParameterLib = require("./plugin-configure-command-parameter");

export class RemovePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
				private $injector: IInjector) { }

	public execute(args: string[]): IFuture<void> {
		return this.$pluginsService.removePlugin(args[0]);
	}

	allowedParameters: ICommandParameter[] = [this.$injector.resolve(pluginConfigureCommandParameterLib.PluginConfigureCommandParameter)];
}
$injector.registerCommand("plugin|remove", RemovePluginCommand);

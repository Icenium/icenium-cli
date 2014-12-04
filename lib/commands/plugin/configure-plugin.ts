///<reference path="../../.d.ts"/>
"use strict";
import pluginConfigureCommandParameterLib = require("./plugin-configure-command-parameter");

export class ConfigurePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $project: Project.IProject,
		private $injector: IInjector) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var configurations = this.$project.configurations;
			_.each(configurations, (configuration:string) => {
				this.$pluginsService.configurePlugin(args[0], configuration).wait();
			});
		}).future<void>()();
	}

	allowedParameters: ICommandParameter[] = [this.$injector.resolve(pluginConfigureCommandParameterLib.PluginConfigureCommandParameter)];
}
$injector.registerCommand("plugin|configure", ConfigurePluginCommand);


import pluginConfigureCommandParameterLib = require("./plugin-configure-command-parameter");

export class RemovePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $injector: IInjector) { }

	public async execute(args: string[]): Promise<void> {
		return this.$pluginsService.removePlugin(args[0]);
	}

	public allowedParameters: ICommandParameter[] = [this.$injector.resolve(pluginConfigureCommandParameterLib.PluginConfigureCommandParameter)];
}

$injector.registerCommand("plugin|remove", RemovePluginCommand);

import pluginConfigureCommandParameterLib = require("./plugin-configure-command-parameter");

export class ConfigurePluginCommand implements ICommand {
	constructor(private $pluginsService: IPluginsService,
		private $injector: IInjector) { }

	public async execute(args: string[]): Promise<void> {
		return	this.$pluginsService.configurePlugin(args[0]);
	}

	allowedParameters: ICommandParameter[] = [this.$injector.resolve(pluginConfigureCommandParameterLib.PluginConfigureCommandParameter)];
}
$injector.registerCommand("plugin|configure", ConfigurePluginCommand);

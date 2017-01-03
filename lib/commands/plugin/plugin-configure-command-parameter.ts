export class PluginConfigureCommandParameter implements ICommandParameter {
	constructor(private $pluginsService: IPluginsService,
		private $errors: IErrors) { }

	public mandatory = true;

	public async validate(pluginName: string): Promise<boolean> {
		if (!pluginName) {
			this.$errors.fail("No plugin name specified");
		}

		if (!this.$pluginsService.isPluginInstalled(pluginName)) {
			this.$errors.fail("Plugin %s is not installed", pluginName);
		}

		return true;
	}
}

///<reference path="../../.d.ts"/>
"use strict";

import {EOL} from "os";

export class FindPluginsCommand implements ICommand {
	constructor(private $errors: IErrors,
				private $logger: ILogger,
				private $pluginsService: IPluginsService) {	}

	public allowedParameters: ICommandParameter[] = [];

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if(!args.length) {
				this.$errors.fail("You have to provide all required parameters.");
			}
			return true;
		}).future<boolean>()();
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let plugins = this.$pluginsService.findPlugins(args).wait();
			this.printPlugins(plugins);
		}).future<void>()();
	}

	private printPlugins(plugins: IBasicPluginInformation[]) {
		if(!plugins || plugins.length === 0) {
			this.$errors.failWithoutHelp("Could not find any plugins matching the provided arguments.");
		}

		_.each(plugins, (plugin) => {
			let pluginDescription = this.composePluginDescription(plugin);
			this.$logger.info(pluginDescription);
		});
	}

	private composePluginDescription(plugin: IBasicPluginInformation) {
		let description = "Name: " + plugin.name + EOL +
			"Description: " + this.trim(plugin.description) + EOL +
			"Version: " + plugin.version + EOL;
		return description;
	}

	private trim(content: string) {
		if (content) {
			return content.trim();
		}
		return undefined;
	}
}
$injector.registerCommand("plugin|find", FindPluginsCommand);

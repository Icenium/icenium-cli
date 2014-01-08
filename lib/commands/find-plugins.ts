///<reference path="../.d.ts"/>
"use strict";

import commands = require("./icommand");
import service = require("../services/cordova-plugins");
import util = require("util");
import os = require("os");
import _ = require("underscore");

module Commands {
	export class FindPluginsCommandData implements commands.Commands.ICommandData {
		constructor(private keywords: string[]) {}

		public get Keywords() {
			return this.keywords;
		}
	}

	export class FindPluginsCommandDataFactory implements commands.Commands.ICommandDataFactory {
		public fromCliArguments(args: string[]): FindPluginsCommandData {
			return new FindPluginsCommandData(args);
		}
	}
	global.$injector.register("findPluginsCommandDataFactory", FindPluginsCommandDataFactory);

	export class FindPluginsCommand implements commands.Commands.ICommand<FindPluginsCommandData> {
		constructor(private findPluginsCommandDataFactory: FindPluginsCommandDataFactory,
			private cordovaPluginsService: service.CordovaPluginsService) {
		}

		public getDataFactory(): FindPluginsCommandDataFactory {
			return this.findPluginsCommandDataFactory;
		}

		public canExecute(data: FindPluginsCommandData): boolean {
			return true;
		}

		public execute(data: FindPluginsCommandData): void {

			this.cordovaPluginsService.getPlugins(data.Keywords)
				.then((plugins) => this.printPlugins(plugins))
				.done();
		}

		private printPlugins(plugins) {
			_.each(plugins, (plugin) => {
				var pluginDescription = this.composePluginDescription(plugin);
				console.log(pluginDescription);
			});
		}

		private composePluginDescription(plugin) {
			var description = util.format("Name: %s%s", plugin.name, os.EOL);
			description += util.format("Description: %s%s", this.trim(plugin.description), os.EOL);
			description += util.format("Version: %s%s", plugin.version, os.EOL);
			return description;
		}

		private trim(content) {
			if (content) {
				return content.trim();
			}
			return undefined;
		}
	}
	global.$injector.register("find-plugins", FindPluginsCommand);
}
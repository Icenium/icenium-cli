///<reference path="../../.d.ts"/>
"use strict";

import service = require("../../services/cordova-plugins");
import validUrl = require("valid-url");

export class FetchPluginCommand implements ICommand {
	constructor(private $logger: ILogger,
				private $fs: IFileSystem,
				private $cordovaPluginsService: service.CordovaPluginsService,
				private $stringParameterBuilder: IStringParameterBuilder) {
	}

	public allowedParameters = [this.$stringParameterBuilder.createMandatoryParameter("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the Cordova Plugin Registry.")];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if (args.length === 0) {
				this.$logger.error("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the Cordova Plugin Registry.");
			} else if (args.length === 1 && (this.isLocalPath(args[0]).wait() || this.isUrlToRepository(args[0]))) {
				var result = this.$cordovaPluginsService.fetch(args[0]).wait();
				this.$logger.out(result);
			} else {
				var plugins = this.$cordovaPluginsService.getPlugins(args);
				var pluginsCount = Object.keys(plugins).length;
				if (pluginsCount === 0) {
					this.$logger.out("There are 0 matching plugins.");
				} else if (pluginsCount > 1) {
					this.$logger.out("There are more then 1 matching plugins.");
				} else {
					this.$logger.out(this.$cordovaPluginsService.fetch(Object.keys(plugins)[0]).wait());
				}
			}
		}).future<void>()();
	}

	private isLocalPath(pluginId: string): IFuture<boolean> {
		return this.$fs.exists(pluginId);
	}

	private isUrlToRepository(pluginId: string): boolean {
		return validUrl.isUri(pluginId);
	}
}
$injector.registerCommand("plugin|fetch", FetchPluginCommand);
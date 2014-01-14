///<reference path="../.d.ts"/>
"use strict";

import service = require("../services/cordova-plugins");
import validUrl = require("valid-url");
import fs = require("fs");

export class FetchPluginCommandData implements Commands.ICommandData {
	constructor(private keywords: string[]) {}

	public get Keywords() {
		return this.keywords;
	}
}

export class FetchPluginCommandDataFactory implements Commands.ICommandDataFactory {
	public fromCliArguments(args: string[]): FetchPluginCommandData {
		return new FetchPluginCommandData(args);
	}
}
$injector.register("fetchPluginCommandDataFactory", FetchPluginCommandDataFactory);

export class FetchPluginCommand implements Commands.ICommand<FetchPluginCommandData> {
	constructor(private fetchPluginCommandDataFactory: FetchPluginCommandDataFactory,
		private logger: ILogger,
		private cordovaPluginsService: service.CordovaPluginsService) {
	}

	public getDataFactory(): FetchPluginCommandDataFactory {
		return this.fetchPluginCommandDataFactory;
	}

	public canExecute(data: FetchPluginCommandData): boolean {
		return true;
	}

	public execute(data: FetchPluginCommandData): void {
		if (data.Keywords.length === 0) {
			this.logger.error("You must specify local path, URL to a plugin repository, name or keywords of a plugin published to the Cordova Plugin Registry.");
		} else if (data.Keywords.length === 1 && (this.isLocalPath(data.Keywords[0]) || this.isUrlToRepository(data.Keywords[0]))) {
			this.cordovaPluginsService.fetch(data.Keywords[0])
				.then(console.log)
				.done();
		} else {
			this.cordovaPluginsService.getPlugins(data.Keywords)
				.then((plugins): any => {
					var pluginsCount = Object.keys(plugins).length;
					if (pluginsCount === 0) {
						return "There are 0 matching plugins.";
					} else if (pluginsCount > 1) {
						return "There are more then 1 matching plugins.";
					} else {
						return this.cordovaPluginsService.fetch(Object.keys(plugins)[0]);
					}
				})
				.then(console.log)
				.done();
		}
	}

	private isLocalPath(pluginId: string): boolean {
		return fs.existsSync(pluginId);
	}

	private isUrlToRepository(pluginId: string): boolean {
		return validUrl.isUri(pluginId);
	}
}
$injector.registerCommand("fetch-plugin", FetchPluginCommand);
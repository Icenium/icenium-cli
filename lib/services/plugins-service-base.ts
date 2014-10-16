///<reference path="../.d.ts"/>
"use strict";

import util = require("util");

export enum PluginType {
	CorePlugin = 0,
	AdvancedPlugin = 1,
	MarketplacePlugin = 2
}

export class CordovaPluginData implements IPlugin {
	constructor(public name: string,
		public type: PluginType) { }

	public get pluginInformation(): string[] {
		var nameRow = util.format("    Plugin: %s", this.name);
		return [nameRow];
	}

	public toProjectDataRecord(): string {
		return this.name;
	}
}

export class MarketplacePluginData extends CordovaPluginData {
	constructor(public name: string,
		public identifier: string,
		public version: string,
		public downloads: number,
		public gitRepoUrl: string,
		public demoAppRepositoryUrl: string) {
		super(name, PluginType.MarketplacePlugin);
	}

	public get pluginInformation(): string[] {
		var nameRow = util.format("    Plugin: %s", this.name);
		var versionRow = util.format("    Version: %s", this.version);
		var urlRow = util.format("    Url: %s", this.gitRepoUrl);
		var demoAppRepositoryUrlRow = util.format("    Demo app repository url: %s", this.demoAppRepositoryUrl);
		var downloadsCountRow = util.format("    Downloads count: %s", this.downloads);

		return [nameRow, versionRow, urlRow, demoAppRepositoryUrlRow, downloadsCountRow];
	}

	public toProjectDataRecord(): string {
		return util.format("%s@%s", this.identifier, this.version);
	}
}

export class PluginsServiceBase {

	public getPluginTypeByName(pluginName: string): PluginType {
		var pluginType = PluginType.AdvancedPlugin;
		if (pluginName.startsWith("org.apache.cordova")) {
			pluginType = PluginType.CorePlugin;
		} else if(pluginName.indexOf("@") > 0) {
			pluginType = PluginType.MarketplacePlugin;
		}

		return pluginType;
	}
}
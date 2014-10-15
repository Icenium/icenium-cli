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

	public get description(): string {
		return this.name;
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

	public get description(): string {
		return util.format("%s, version: %s, url: %s, demo app repository url: %s", this.name, this.version, this.gitRepoUrl, this.demoAppRepositoryUrl);
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
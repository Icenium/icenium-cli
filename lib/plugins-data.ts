///<reference path=".d.ts"/>
"use strict";

import util = require("util");

export enum PluginType {
	CorePlugin = 0,
	AdvancedPlugin = 1,
	MarketplacePlugin = 2
}

export class CordovaPluginData implements IPlugin {
	public configurations: string[];

	constructor(public data: Server.CordovaPluginData,
		public type: PluginType) {
		this.configurations = [];
	}

	public get pluginInformation(): string[] {
		var nameRow = util.format("    Plugin: %s", this.data.Name);
		var identifierRow = util.format("    Identifier: %s", this.data.Identifier);
		var versionRow = util.format("    Version: %s", this.data.Version);
		var urlRow = util.format("    Url: %s", this.data.Url);
		var platformsRow = util.format("    Platforms: %s", this.data.Platforms.join(", "));
		var configurationsRow = util.format("    Configuration: %s", this.configurations.join(", "));

		return [nameRow, identifierRow, versionRow, urlRow, platformsRow, configurationsRow];
	}

	public toProjectDataRecord(): string {
		return this.data.Identifier;
	}
}

export class MarketplacePluginData extends CordovaPluginData {
	constructor(public data: Server.CordovaPluginData,
		public downloads: number,
		public demoAppRepositoryUrl: string) {
		super(data, PluginType.MarketplacePlugin);
	}

	public get pluginInformation(): string[] {
		var nameRow = util.format("    Plugin: %s", this.data.Name);
		var identifierRow = util.format("    Identifier: %s", this.data.Identifier);
		var versionRow = util.format("    Version: %s", this.data.Version);
		var urlRow = util.format("    Url: %s", this.data.Url);
		var demoAppRepositoryUrlRow = util.format("    Demo app repository url: %s", this.demoAppRepositoryUrl);
		var downloadsCountRow = util.format("    Downloads count: %s", this.downloads);

		return [nameRow, identifierRow, versionRow, urlRow, demoAppRepositoryUrlRow, downloadsCountRow];
	}

	public toProjectDataRecord(): string {
		return util.format("%s@%s", this.data.Identifier, this.data.Version);
	}
}
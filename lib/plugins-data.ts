///<reference path=".d.ts"/>
"use strict";

import util = require("util");

export enum PluginType {
	CorePlugin = 0,
	AdvancedPlugin = 1,
	MarketplacePlugin = 2
}

export class CordovaPluginData implements IPlugin {
	constructor(public name: string,
		public identifier: string,
		public version: string,
		public description: string,
		public url: string,
		public type: PluginType,
		public variables: string[],
		public platforms: Server.DevicePlatform[]) { }

	public get pluginInformation(): string[] {
		var nameRow = util.format("    Plugin: %s", this.name);
		var identifierRow = util.format("    Identifier: %s", this.identifier);
		var versionRow = util.format("    Version: %s", this.version);
		var urlRow = util.format("    Url: %s", this.url);
		var platformsRow = util.format("    Platforms: %s", this.platforms.join(","));
		return [nameRow, identifierRow, versionRow, urlRow, platformsRow];
	}

	public toProjectDataRecord(): string {
		return this.identifier;
	}
}

export class MarketplacePluginData extends CordovaPluginData {
	constructor(name: string,
		identifier: string,
		version: string,
		description: string,
		url: string,
		variables: string[],
		platforms: Server.DevicePlatform[],
		public downloads: number,
		public demoAppRepositoryUrl: string) {
		super(name, identifier, version, description, url, PluginType.MarketplacePlugin, variables, platforms);
	}

	public get pluginInformation(): string[] {
		var nameRow = util.format("    Plugin: %s", this.name);
		var identifierRow = util.format("    Identifier: %s", this.identifier);
		var versionRow = util.format("    Version: %s", this.version);
		var urlRow = util.format("    Url: %s", this.url);
		var demoAppRepositoryUrlRow = util.format("    Demo app repository url: %s", this.demoAppRepositoryUrl);
		var downloadsCountRow = util.format("    Downloads count: %s", this.downloads);

		return [nameRow, identifierRow, versionRow, urlRow, demoAppRepositoryUrlRow, downloadsCountRow];
	}

	public toProjectDataRecord(): string {
		return util.format("%s@%s", this.identifier, this.version);
	}
}
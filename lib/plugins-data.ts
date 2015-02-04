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

		var result = [nameRow, identifierRow, versionRow, urlRow, platformsRow];
		if(this.configurations && this.configurations.length > 0) {
			result.push(util.format("    Configuration: %s", this.configurations.join(", ")));
		}

		if(this.data.Variables && this.data.Variables.length > 0) {
			result.push(util.format("    Variables: %s", this.data.Variables.join(", ")));
		}

		return result;
	}

	public toProjectDataRecord(): string {
		return this.data.Identifier;
	}
}

export class MarketplacePluginData extends CordovaPluginData {
	private static TELERIK_PUBLISHER_NAME = "Telerik plugins";
	private static TELERIK_PARTNER_PUBLISHER_NAME = "Telerik partner plugins";

	constructor(public data: Server.CordovaPluginData,
		public downloads: number,
		public demoAppRepositoryUrl: string,
		public publisher: IPublisher) {
		super(data, PluginType.MarketplacePlugin);
	}

	public get pluginInformation(): string[] {
		var nameRow = util.format("    Plugin: %s", this.data.Name);
		var identifierRow = util.format("    Identifier: %s", this.data.Identifier);
		var versionRow = util.format("    Version: %s", this.data.Version);
		var urlRow = util.format("    Url: %s", this.data.Url);
		var demoAppRepositoryUrlRow = util.format("    Demo app repository url: %s", this.demoAppRepositoryUrl);
		var downloadsCountRow = util.format("    Downloads count: %s", this.downloads);
		var publisherName = this.getPublisherName(this.publisher);

		var result = [nameRow, identifierRow, versionRow, urlRow, demoAppRepositoryUrlRow, downloadsCountRow];

		if(publisherName) {
			result.push(util.format("    Publisher: %s", publisherName));
		}

		if(this.data.Variables && this.data.Variables.length > 0) {
			result.push(util.format("    Variables: %s", this.data.Variables.join(", ")));
		}

		return  result;
	}

	public toProjectDataRecord(): string {
		return util.format("%s@%s", this.data.Identifier, this.data.Version);
	}

	private getPublisherName(publisher: IPublisher): string {
		if(publisher && publisher.name) {
			if(publisher.name === MarketplacePluginData.TELERIK_PUBLISHER_NAME) {
				return "Telerik";
			}

			if(publisher.name === MarketplacePluginData.TELERIK_PARTNER_PUBLISHER_NAME) {
				return "Telerik Partner";
			}
		}

		return "";
	}
}
///<reference path=".d.ts"/>
"use strict";

import os = require("os");
import util = require("util");

export enum PluginType {
	CorePlugin = 0,
	AdvancedPlugin = 1,
	MarketplacePlugin = 2
}

export class CordovaPluginData implements IPlugin {
	public configurations: string[];

	constructor(public data: Server.CordovaPluginData,
		public type: PluginType,
		protected $project: Project.IProject,
		protected $projectConstants: Project.IProjectConstants) {
		this.configurations = [];
	}

	public get pluginInformation(): string[] {
		let additionalPluginData = [this.buildRow("Platforms", this.data.Platforms.join(", "))];
		return this.composePluginInformation(additionalPluginData);
	}

	public toProjectDataRecord(version: string): string {
		return this.data.Identifier;
	}

	protected buildRow(key: string, value: string): string {
		return util.format("    %s: %s", key, value);
	}

	protected composePluginInformation(additionalPluginData: string[]): string[] {
		let result = <string[]>(_.flatten([this.getBasicPluginInformation(), additionalPluginData, this.getPluginVariablesInfo()]));
		return result;
	}

	private getBasicPluginInformation(): string[] {
		let nameRow = this.buildRow("Plugin", this.data.Name);
		let identifierRow = this.buildRow("Identifier", this.data.Identifier);
		let versionRow = this.buildRow("Version", this.data.Version);
		let urlRow = this.buildRow("Url", this.data.Url);

		let result = [nameRow, identifierRow, versionRow, urlRow];

		if(this.configurations && this.configurations.length > 0) {
			result.push(util.format("    Configuration: %s", this.configurations.join(", ")));
		}

		return result;
	}

	private getPluginVariablesInfo(): string[] {
		let result: string[] = [];
		_.each(this.configurations, (configuration: string) => {
			let pluginVariablesData = this.$project.getProperty(this.$projectConstants.CORDOVA_PLUGIN_VARIABLES_PROPERTY_NAME, configuration);
			if(pluginVariablesData && pluginVariablesData[this.data.Identifier]) {
				let variables = pluginVariablesData[this.data.Identifier];
				let variableNames = _.keys(variables);
				if(variableNames.length > 0) {
					let output:string[] = [];
					output.push(util.format("    Variables for %s configuration:", configuration));
					_.each(variableNames, (variableName:string) => {
						output.push(util.format("        %s: %s", variableName, variables[variableName]));
					});

					result.push(output.join(os.EOL));
				}
			}
		});

		return result;
	}
}

export class MarketplacePluginData extends CordovaPluginData {
	private static TELERIK_PUBLISHER_NAME = "Telerik plugins";
	private static TELERIK_PARTNER_PUBLISHER_NAME = "Telerik partner plugins";

	constructor(public pluginVersionsData: Server.MarketplacePluginVersionsData,
		public data: Server.MarketplacePluginData,
		$project: Project.IProject,
		$projectConstants: Project.IProjectConstants) {
		super(data, PluginType.MarketplacePlugin, $project, $projectConstants);
	}

	public get pluginInformation(): string[] {
		let additionalPluginData = [
			this.buildRow("Downloads count", this.data.DownloadsCount.toString()),
			this.buildRow("Available versions",  _.map(this.pluginVersionsData.Versions, pl => pl.Version).join(", "))
		];

		let publisherName = this.getPublisherName(this.data.Publisher);
		if(publisherName) {
			additionalPluginData.push(this.buildRow("Publisher", publisherName));
		}

		return this.composePluginInformation(additionalPluginData);
	}

	public toProjectDataRecord(version: string): string {
		return util.format("%s@%s", this.data.Identifier, version || this.data.Version);
	}

	private getPublisherName(publisher: Server.MarketplacePluginPublisher): string {
		if(publisher && publisher.Name) {
			if(publisher.Name === MarketplacePluginData.TELERIK_PUBLISHER_NAME) {
				return "Telerik";
			}

			if(publisher.Name === MarketplacePluginData.TELERIK_PARTNER_PUBLISHER_NAME) {
				return "Telerik Partner";
			}
		}

		return "";
	}
}
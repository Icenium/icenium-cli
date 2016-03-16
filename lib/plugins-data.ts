///<reference path=".d.ts"/>
"use strict";

import {EOL} from "os";
import * as util from "util";

export enum PluginType {
	CorePlugin = 0,
	AdvancedPlugin = 1,
	MarketplacePlugin = 2
}

export class CordovaPluginData implements IPlugin {
	public configurations: string[];

	constructor(public data: IMarketplacePluginData,
		public type: PluginType,
		protected $project: Project.IProject,
		protected $projectConstants: IProjectConstants) {
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
		if(this.configurations && this.configurations.length) {
			_.each(this.configurations, (configuration: string) => {
				let info = this.getPluginVarsStringInformation(configuration).wait();
				result.push(...info);
			});
		} else {
			let info = this.getPluginVarsStringInformation().wait();
			result.push(...info);
		}

		return result;
	}

	private getPluginVarsStringInformation(configuration?: string): IFuture<string[]> {
		return ((): string[] => {
			let result: string[] = [];
			let configString = configuration ? ` for ${configuration} configuration` : "";
			let pluginVariablesData = this.$project.getPluginVariablesInfo(configuration).wait();
			if(pluginVariablesData && pluginVariablesData[this.data.Identifier]) {
				let variables = pluginVariablesData[this.data.Identifier];
				let variableNames = _.keys(variables);
				if(variableNames.length > 0) {
					let output:string[] = [];
					output.push(`    Variables${configString}:`);
					_.each(variableNames, (variableName:string) => {
						output.push(util.format("        %s: %s", variableName, variables[variableName]));
					});

					result.push(output.join(EOL));
				}
			} else {
				if(this.data.Variables) {
					// We should never get here with anything that is not array, but anyway, lets assure we'll not throw some unexpected error.
					if(_.isArray(this.data.Variables) && (<string[]>this.data.Variables).length) {
						// cordova or marketplace plugins
						result.push(`    Variables${configString}: ${(<string[]>this.data.Variables).join(", ")}`);
					} else if(_.keys(this.data.Variables).length) {
						// nativescript
						result.push(`    Variables${configString}: ${_.keys(this.data.Variables).join(", ")}`);
					}
				}
			}

			return result;
		}).future<string[]>()();
	}
}

export class MarketplacePluginData extends CordovaPluginData {
	private static TELERIK_PUBLISHER_NAME = "Telerik plugins";
	private static TELERIK_PARTNER_PUBLISHER_NAME = "Telerik partner plugins";

	constructor(public pluginVersionsData: IMarketplacePluginVersionsDataBase,
		public data: IMarketplacePluginData,
		$project: Project.IProject,
		$projectConstants: IProjectConstants) {
		super(data, PluginType.MarketplacePlugin, $project, $projectConstants);
		this.data.Identifier = (<any>this.pluginVersionsData).Identifier;
	}

	public get pluginInformation(): string[] {
		let additionalPluginData = [
			this.buildRow("Available versions",  _.map(this.pluginVersionsData.Versions, pl => pl.Version).join(", "))
		];

		if(this.data.DownloadsCount) {
			additionalPluginData.unshift(this.buildRow("Downloads count", this.data.DownloadsCount.toString()));
		}

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

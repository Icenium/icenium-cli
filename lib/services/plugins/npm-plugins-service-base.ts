///<reference path="../../.d.ts"/>

import temp = require("temp");
temp.track();

export abstract class NpmPluginsServiceBase implements IPluginsService {
	protected static NPM_SEARCH_URL = "http://npmsearch.com";

	constructor(protected $errors: IErrors,
		protected $childProcess: IChildProcess) { }

	public findPlugins(keywords: string[]): IFuture<IBasicPluginInformation[]> {
		return ((): IBasicPluginInformation[] => {
			let pluginsFound: IBasicPluginInformation[] = [];

			let searchParams = ["search", "ecosystem:cordova"].concat(keywords);

			let npmSearchResult = this.$childProcess.spawnFromEvent("npm.cmd", searchParams, "close").wait();

			if (npmSearchResult.stderr) {
				this.$errors.failWithoutHelp(npmSearchResult.stderr);
			}

			// Need to split the result only by \n because the npm result contains only \n and on Windows it will not split correctly when using EOL.
			// Sample output:
			// NAME                    DESCRIPTION             AUTHOR        DATE       VERSION  KEYWORDS
			// cordova-plugin-console  Cordova Console Plugin  =csantanapr…  2016-04-20 1.0.3    cordova console ecosystem:cordova cordova-ios
			let pluginsRows: string[] = npmSearchResult.stdout.split("\n");

			// Remove the table headers row.
			pluginsRows.shift();

			let npmNameGroup = "(\\S+)\\s+";
			let npmDateGroup = "(\\d+\\-\\d+\\-\\d+)\\s";
			let npmFreeTextGroup = "([^=]+)";
			let npmAuthorsGroup = "((?:=\\S+\\s?)+)\\s+";

			// Should look like this /(\S+)\s+([^=]+)((?:=\S+\s?)+)\s+(\d+\-\d+\-\d+)\s(\S+)\s+([^=]+)/
			let pluginRowRegExp = new RegExp(`${npmNameGroup}${npmFreeTextGroup}${npmAuthorsGroup}${npmDateGroup}${npmNameGroup}${npmFreeTextGroup}`);

			_.each(pluginsRows, (pluginRow: string) => {
				let matches = pluginRowRegExp.exec(pluginRow.trim());

				if (!matches || !matches[0]) {
					return;
				}

				pluginsFound.push({
					name: matches[1],
					description: matches[2],
					version: matches[5]
				});
			});

			return pluginsFound;
		}).future<IBasicPluginInformation[]>()();
	}

	public abstract getAvailablePlugins(pluginsCount?: number): IPlugin[];

	public abstract getInstalledPlugins(): IPlugin[];

	public abstract printPlugins(plugins: IPlugin[]): void;

	public abstract addPlugin(pluginIdentifier: string): IFuture<void>;

	public abstract removePlugin(pluginName: string): IFuture<void>;

	public abstract configurePlugin(pluginName: string, version?: string, configurations?: string[]): IFuture<void>;

	public abstract isPluginInstalled(pluginName: string): boolean;

	public abstract getPluginBasicInformation(pluginName: string): IFuture<IBasicPluginInformation>;

	public abstract fetch(pluginIdentifier: string): IFuture<void>;

	public abstract filterPlugins(plugins: IPlugin[]): IFuture<IPlugin[]>;

	protected getStringFromNpmSearchResult(pluginResult: any, propertyName: string): string {
		if (pluginResult && pluginResult[propertyName] && pluginResult[propertyName].length) {
			let item = _.first(pluginResult[propertyName]);
			if (item) {
				return item.toString();
			}
		}

		return "";
	}
}

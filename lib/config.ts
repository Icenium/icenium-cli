///<reference path=".d.ts"/>

"use strict";

import path = require("path");
import helpers = require("./helpers");

export class Configuration implements IConfiguration {
	AB_SERVER_PROTO: string;
	AB_SERVER: string;
	DEBUG :boolean;
	PROXY_TO_FIDDLER: boolean;
	PROJECT_FILE_NAME: string;
	SOLUTION_SPACE_NAME: string;
	QR_SIZE: number;
	DEFAULT_PROJECT_TEMPLATE: string;
	CORDOVA_PLUGINS_REGISTRY: string;
	DEFAULT_PROJECT_NAME: string;
	CI_LOGGER: boolean;
	WRAP_CLIENT_ID: string;
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;
	AUTO_UPGRADE_PROJECT_FILE: boolean;
	ANALYTICS_API_KEY: string;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(private $fs: IFileSystem) {
		this.mergeConfig(this, this.loadConfig("config").wait());
	}

	private getConfigName(filename: string) : string {
		return path.join(__dirname, "../config/", filename + ".json");
	}

	private copyFile(from: string, to: string): IFuture<void> {
		return this.$fs.copyFile(from, to);
	}

	private loadConfig(name: string): IFuture<any> {
		return ((): any => {
			var configFileName = this.getConfigName(name);
			return this.$fs.readJson(configFileName).wait();
		}).future<any>()();
	}

	private saveConfig(config, name: string): IFuture<any> {
		var configNoFunctions = {};
		Object.keys(config).forEach((key) => {
			var entry = config[key];
			if (typeof entry !== "function") {
				configNoFunctions[key] = entry;
			}
		});

		var configFileName = this.getConfigName(name);
		return this.$fs.writeJson(configFileName, configNoFunctions, "\t");
	}

	private mergeConfig(config, mergeFrom) {
		Object.keys(mergeFrom).forEach((key) => {
			config[key] = mergeFrom[key];
		});
	}

	reset(): IFuture<void> {
		return this.copyFile(this.getConfigName("config-base"), this.getConfigName("config"));
	}

	apply(configName: string): IFuture<void> {
		return ((): any => {
			var baseConfig = this.loadConfig("config-base").wait();
			var newConfig = this.loadConfig("config-" + configName).wait();
			this.mergeConfig(baseConfig, newConfig);
			this.saveConfig(baseConfig, "config").wait();
		}).future<void>()();
	}

	public version: string = require("../package.json").version;
}
$injector.register("config", Configuration);
helpers.registerCommand("config", "dev-config-reset", (config, args) => config.reset());
helpers.registerCommand("config", "dev-config-apply", (config, args) => config.apply(args[0]));

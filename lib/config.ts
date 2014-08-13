///<reference path=".d.ts"/>
"use strict";
import path = require("path");
import helpers = require("./helpers");

export class Configuration implements IConfiguration { // User specific config
	AB_SERVER_PROTO: string;
	AB_SERVER: string;
	DEBUG :boolean;
	PROXY_TO_FIDDLER: boolean;
	DEFAULT_CORDOVA_PROJECT_TEMPLATE: string;
	DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE: string;
	CORDOVA_PLUGINS_REGISTRY: string;
	CI_LOGGER: boolean;
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;
	AUTO_UPGRADE_PROJECT_FILE: boolean;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(private $fs: IFileSystem) {
		this.mergeConfig(this, this.loadConfig("config").wait());
	}

	public reset(): IFuture<void> {
		return this.copyFile(this.getConfigName("config-base"), this.getConfigName("config"));
	}

	public apply(configName: string): IFuture<void> {
		return ((): any => {
			var baseConfig = this.loadConfig("config-base").wait();
			var newConfig = this.loadConfig("config-" + configName).wait();
			this.mergeConfig(baseConfig, newConfig);
			this.saveConfig(baseConfig, "config").wait();
		}).future<void>()();
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

	private saveConfig(config: IConfiguration, name: string): IFuture<void> {
		var configNoFunctions = Object.create(null);
		Object.keys(config).forEach((key) => {
			var entry = config[key];
			if (typeof entry !== "function") {
				configNoFunctions[key] = entry;
			}
		});

		var configFileName = this.getConfigName(name);
		return this.$fs.writeJson(configFileName, configNoFunctions, "\t");
	}

	private mergeConfig(config: IConfiguration, mergeFrom: IConfiguration) {
		_.extend(config, mergeFrom);
	}
}
$injector.register("config", Configuration);

helpers.registerCommand("config", "dev-config-reset", (config, args) => config.reset());
helpers.registerCommand("config", "dev-config-apply", (config, args) => config.apply(args[0]));

export class StaticConfig implements IStaticConfig {
	public PROJECT_FILE_NAME = ".abproject";
	public CLIENT_NAME = "appbuilder";
	public ANALYTICS_API_KEY = "13eaa7db90224aa1861937fc71863ab8";

	public SOLUTION_SPACE_NAME = "Private_Build_Folder";
	public QR_SIZE = 300;

	public version = require("../package.json").version;

	public get helpTextPath() {
		return path.join(__dirname, "../resources/help.txt");
	}
}
$injector.register("staticConfig", StaticConfig);
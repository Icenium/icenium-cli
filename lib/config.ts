///<reference path=".d.ts"/>

"use strict";

import path = require("path");
import helpers = require("./helpers");

/*don't require logger in config.js due to cyclic dependency*/;
export class Configuration implements IConfiguration {
	private cachedServerConfiguration: IServerConfigurationData = null;

	AB_SERVER_PROTO: string;
	AB_SERVER: string;
	DEBUG :boolean;
	PROXY_TO_FIDDLER: boolean;
	PROJECT_FILE_NAME: string;
	SOLUTION_SPACE_NAME: string;
	QR_SIZE: number;
	DEFAULT_PROJECT_TEMPLATE: string;
	TEMPLATE_NAMES: string[];
	CORDOVA_PLUGINS_REGISTRY: string;
	DEFAULT_PROJECT_NAME: string;
	CI_LOGGER: boolean;
	WRAP_CLIENT_ID: string;

	constructor(private $fs: IFileSystem) {
		this.mergeConfig(this, this.loadConfig("config").wait());
	}

	public get tfisServer(): string {
		return this.getConfigurationFromServer().stsServer;
	}

	public getConfigurationFromServer(): IServerConfigurationData {
		if(!this.cachedServerConfiguration) {
			var configUri = this.AB_SERVER_PROTO + "://" + this.AB_SERVER + "/configuration.json";
			var httpClient = $injector.resolve("httpClient");
			this.cachedServerConfiguration = new ServerConfigurationData(JSON.parse(httpClient.httpRequest(configUri).wait().body));
		}

		return this.cachedServerConfiguration;
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
		return this.$fs.writeJson(configFileName, configNoFunctions);
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
}
$injector.register("config", Configuration);
helpers.registerCommand("config", "config-reset", (config, args) => config.reset());
helpers.registerCommand("config", "config-apply", (config, args) => config.apply(args[0]));

class ServerConfigurationData {
	constructor(private json: any) { }

	public get assemblyVersion(): string {
		return this.json.assemblyVersion;
	}

	public get applicationName(): string {
		return this.json.applicationName;
	}

	public get backendServiceScheme(): string {
		return this.json.backendServiceScheme;
	}

	public get stsServer(): string {
		return this.json.stsServer;
	}

	public get clientId(): string {
		return this.json.clientId;
	}

	public get analyticsAccountCode(): string {
		return this.json.analyticsAccountCode;
	}

	public get eqatecProductId(): string {
		return this.json.eqatecProductId;
	}
}

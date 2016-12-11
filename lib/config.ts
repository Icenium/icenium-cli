import * as path from "path";
import {ConfigBase} from "./common/config-base";
import { StaticConfigBase } from "./common/static-config-base";
import * as osenv from "osenv";

export class Configuration extends ConfigBase implements IConfiguration { // User specific config
	AB_SERVER_PROTO: string;
	AB_SERVER: string;
	DEBUG: boolean;
	USE_PROXY: boolean;
	PROXY_HOSTNAME: string;
	PROXY_PORT: number;
	ON_PREM: boolean;
	DEFAULT_CORDOVA_PROJECT_TEMPLATE: string;
	DEFAULT_NATIVESCRIPT_PROJECT_TEMPLATE: string;
	CORDOVA_PLUGINS_REGISTRY: string;
	CI_LOGGER: boolean;
	USE_CDN_FOR_EXTENSION_DOWNLOAD: boolean;
	AUTO_UPGRADE_PROJECT_FILE: boolean;
	TYPESCRIPT_COMPILER_OPTIONS: ITypeScriptCompilerOptions;

	/*don't require logger and everything that has logger as dependency in config.js due to cyclic dependency*/
	constructor(protected $fs: IFileSystem) {
		super($fs);

		let configPath = this.getConfigPath("config");
		if (!this.$fs.exists(configPath)) {
			let configBase = this.loadConfig("config-base");
			this.$fs.writeJson(configPath, configBase).wait();
		} else {
			this.mergeConfig(this, this.loadConfig("config"));
		}
	}

	public reset(): IFuture<void> {
		return this.copyFile(this.getConfigPath("config-base"), this.getConfigPath("config"));
	}

	public apply(configName: string): IFuture<void> {
		return ((): any => {
			let baseConfig = this.loadConfig("config-base");
			let newConfig = this.loadConfig("config-" + configName);
			this.mergeConfig(baseConfig, newConfig);
			this.saveConfig(baseConfig, "config").wait();
		}).future<void>()();
	}

	public printConfigData(): void {
		let config = this.loadConfig("config");
		console.log(config);
	}

	private copyFile(from: string, to: string): IFuture<void> {
		return this.$fs.copyFile(from, to);
	}

	private saveConfig(config: IConfiguration, name: string): IFuture<void> {
		let configNoFunctions = Object.create(null);
		_.each(<any>config, (entry, key) => {
			if (typeof entry !== "function") {
				configNoFunctions[key] = entry;
			}
		});

		let configFileName = this.getConfigPath(name);
		return this.$fs.writeJson(configFileName, configNoFunctions);
	}

	private mergeConfig(config: IConfiguration, mergeFrom: IConfiguration): void {
		_.extend(config, mergeFrom);
	}

}
$injector.register("config", Configuration);

export class StaticConfig extends StaticConfigBase implements IStaticConfig {
	constructor($injector: IInjector) {
		super($injector);
		this.RESOURCE_DIR_PATH = path.join(this.RESOURCE_DIR_PATH, "../../resources");
	}

	private static TOKEN_FILENAME = ".abgithub";
	public PROJECT_FILE_NAME = ".abproject";
	public CLIENT_NAME = "AppBuilder";
	public ANALYTICS_API_KEY = "13eaa7db90224aa1861937fc71863ab8";
	public ANALYTICS_FEATURE_USAGE_TRACKING_API_KEY = "13eaa7db90224aa1861937fc71863ab8";
	public TRACK_FEATURE_USAGE_SETTING_NAME = "AnalyticsSettings.TrackFeatureUsage";
	public ERROR_REPORT_SETTING_NAME = "AnalyticsSettings.TrackExceptions";
	public ANALYTICS_INSTALLATION_ID_SETTING_NAME = "AnalyticsInstallationID";
	public SYS_REQUIREMENTS_LINK = "http://docs.telerik.com/platform/appbuilder/running-appbuilder/running-the-cli/system-requirements-cli";
	public SOLUTION_SPACE_NAME = "Private_Build_Folder";
	public FULL_CLIENT_NAME = "Telerik AppBuilder CLI by Progress";
	public QR_SIZE = 300;
	public get GITHUB_ACCESS_TOKEN_FILEPATH(): string {
		return path.join(osenv.home(), StaticConfig.TOKEN_FILENAME);
	}

	public version = require("../package.json").version;

	public triggerJsonSchemaValidation = true;

	public get helpTextPath() {
		return path.join(__dirname, "../resources/help.txt");
	}

	public get HTML_CLI_HELPERS_DIR(): string {
		return path.join(__dirname, "../docs/helpers");
	}

	public get pathToPackageJson(): string {
		return path.join(__dirname, "..", "package.json");
	}

	public get PATH_TO_BOOTSTRAP(): string {
		return path.join(__dirname, "bootstrap");
	}
}
$injector.register("staticConfig", StaticConfig);

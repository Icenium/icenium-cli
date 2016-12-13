import * as xmlMapping from "xml-mapping";
import * as path from "path";
import * as helpers from "../helpers";
import { UserSettingsServiceBase } from "../common/services/user-settings-service";
import { UserSettings } from "../constants";

export class ClientUserSettingsFileService implements IUserSettingsFileService {
	private userSettingsFile: string;

	constructor(private $fs: IFileSystem,
		$options: IOptions) {
		this.userSettingsFile = path.join($options.profileDir, UserSettings.LocalFileName);
	}

	public get userSettingsFilePath(): string {
		return this.userSettingsFile;
	}

	public deleteUserSettingsFile(): void {
		return this.$fs.deleteFile(this.userSettingsFilePath);
	}
}
$injector.register("clientUserSettingsFileService", ClientUserSettingsFileService);

export class ClientSpecificUserSettingsService extends UserSettingsServiceBase {
	constructor($fs: IFileSystem,
		$clientUserSettingsFileService: IUserSettingsFileService) {
		super($clientUserSettingsFileService.userSettingsFilePath, $fs);
	}
}
$injector.register("clientSpecificUserSettingsService", ClientSpecificUserSettingsService);

export class SharedUserSettingsFileService implements IUserSettingsFileService {
	private userSettingsFile: string;

	constructor(private $fs: IFileSystem,
		private $config: Config.IConfig,
		private $options: IOptions) {
		this.userSettingsFile = path.join(this.$options.profileDir, this.$config.AB_SERVER + UserSettings.FileExtension);
	}

	public get userSettingsFilePath(): string {
		return this.userSettingsFile;
	}

	public deleteUserSettingsFile(): void {
		return this.$fs.deleteFile(this.userSettingsFilePath);
	}
}
$injector.register("sharedUserSettingsFileService", SharedUserSettingsFileService);

export class SharedUserSettingsService extends UserSettingsServiceBase implements IUserSettingsService {
	private static SETTINGS_ROOT_TAG = "JustDevelopSettings";

	constructor(private $server: Server.IServer,
		private $sharedUserSettingsFileService: IUserSettingsFileService,
		private $loginManager: ILoginManager,
		private $options: IOptions,
		$fs: IFileSystem,
		$clientUserSettingsFileService: IUserSettingsFileService) {
		super($clientUserSettingsFileService.userSettingsFilePath, $fs);
	}

	public loadUserSettingsFile(): IFuture<void> {
		return (() => {
			if (!this.userSettingsData) {
				this.$fs.createDirectory(this.$options.profileDir);

				if (this.$fs.exists(this.$sharedUserSettingsFileService.userSettingsFilePath)) {
					let fileInfo = this.$fs.getFsStats(this.$sharedUserSettingsFileService.userSettingsFilePath);
					let timeDiff = Math.abs(new Date().getTime() - fileInfo.mtime.getTime());
					let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
					if (diffDays > 1) {
						this.downloadUserSettings().wait();
					} else {
						this.readUserSettingsFile();
					}
				} else {
					this.downloadUserSettings().wait();
				}
			}
		}).future<void>()();
	}

	private downloadUserSettings(): IFuture<void> {
		return (() => {
			try {
				this.$server.rawSettings.getUserSettings(UserSettings.DefaultFileName, this.$fs.createWriteStream(this.$sharedUserSettingsFileService.userSettingsFilePath)).wait();
				this.userSettingsData = xmlMapping.tojson(this.$fs.readText(this.$sharedUserSettingsFileService.userSettingsFilePath));
			} catch (error) {
				if (error.response && error.response.statusCode === 404) {
					this.userSettingsData = null;
				} else {
					throw error;
				}
			}
		}).future<void>()();
	}

	public getSettingValue<T>(settingName: string): IFuture<T> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();
			this.loadUserSettingsFile().wait();

			if (!this.userSettingsData) {
				return null;
			}

			let data = this.userSettingsData[SharedUserSettingsService.SETTINGS_ROOT_TAG];
			try {
				settingName.split(".").forEach(property => { data = data[property]; });
			} catch (e) {
				return null;
			}

			if (data && data.$t) {
				return data.$t;
			}

			return data;
		}).future<T>()();
	}

	private readUserSettingsFile(): void {
		this.userSettingsData = xmlMapping.tojson(this.$fs.readText(this.$sharedUserSettingsFileService.userSettingsFilePath));
	}

	public saveSetting<T>(key: string, value: T): IFuture<void> {
		let settingObject: any = {};
		settingObject[key] = value;

		return this.saveSettings(settingObject);
	}

	public saveSettings(data: { [key: string]: {} }): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			if (Object.keys(data).length !== 0) {
				this.downloadUserSettings().wait();
			} else {
				this.readUserSettingsFile();
			}

			this.userSettingsData = this.userSettingsData || {};

			if (!this.userSettingsData.hasOwnProperty(SharedUserSettingsService.SETTINGS_ROOT_TAG)) {
				this.userSettingsData[SharedUserSettingsService.SETTINGS_ROOT_TAG] = {};
			}

			Object.keys(data).forEach(property => {
				let newPropertyName = property + ".$t";
				data[newPropertyName] = data[property];
				delete data[property];
			});

			let convertedData = helpers.convertDottedStringToObject(data);
			helpers.mergeRecursive(this.userSettingsData[SharedUserSettingsService.SETTINGS_ROOT_TAG], convertedData);

			let xml = xmlMapping.toxml(this.userSettingsData);
			this.$server.rawSettings.saveUserSettings(UserSettings.DefaultFileName, xml).wait();

			if (Object.keys(data).length !== 0) {
				this.$fs.writeFile(this.$sharedUserSettingsFileService.userSettingsFilePath, xml);
			}
		}).future<void>()();
	}
}
$injector.register("sharedUserSettingsService", SharedUserSettingsService);

export class UserSettingsService extends UserSettingsServiceBase implements UserSettings.IUserSettingsService {
	private static ANALYTICS_INSTALLATION_ID_PROPERTY_NAME = "AnalyticsInstallationID";

	constructor(private $sharedUserSettingsService: IUserSettingsService,
		private $clientSpecificUserSettingsService: IUserSettingsService,
		$fs: IFileSystem,
		$clientUserSettingsFileService: IUserSettingsFileService) {
		super($clientUserSettingsFileService.userSettingsFilePath, $fs);
	}

	public getSettingValue<T>(settingName: string): IFuture<any> {
		if (settingName === UserSettingsService.ANALYTICS_INSTALLATION_ID_PROPERTY_NAME) {
			return this.$clientSpecificUserSettingsService.getSettingValue(settingName);
		}

		return this.$sharedUserSettingsService.getSettingValue(settingName);
	}

	public saveSetting<T>(key: string, value: T): IFuture<void> {
		if (key === UserSettingsService.ANALYTICS_INSTALLATION_ID_PROPERTY_NAME) {
			return this.$clientSpecificUserSettingsService.saveSetting(key, value);
		}

		return this.$sharedUserSettingsService.saveSetting(key, value);
	}
}
$injector.register("userSettingsService", UserSettingsService);

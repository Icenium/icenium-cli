import constants = require("../../common/constants");
import {EOL} from "os";

export class LiveSyncService implements ILiveSyncService {
	private excludedProjectDirsAndFiles = ["app_resources", "plugins", ".*.tmp", ".ab"];
	private deviceConfigurationInfos: Mobile.IApplicationInfo[] = [];

	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $project: Project.IProject,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $injector: IInjector) { }

	public async livesync(platform?: string): Promise<void> {
			this.$project.ensureProject();
			await this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device });
			platform = platform || this.$devicesService.platform;

			if (!this.$mobileHelper.getPlatformCapabilities(platform).companion && this.$options.companion) {
				this.$errors.failWithoutHelp("The AppBuilder Companion app is not available on %s devices.", platform);
			}

			if (!this.$devicesService.hasDevices) {
				this.$errors.failWithoutHelp(constants.ERROR_NO_DEVICES);
			}

			if (!this.$project.capabilities.livesync && !this.$options.companion) {
				this.$errors.failWithoutHelp("Use $ appbuilder livesync cloud to sync your application to Telerik Nativescript Companion App. You will be able to LiveSync %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			if (!this.$project.capabilities.livesyncCompanion && this.$options.companion) {
				this.$errors.failWithoutHelp("You will be able to LiveSync %s based applications to the Companion app in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			let projectDir = this.$project.getProjectDir();

			let livesyncData: ILiveSyncData = {
				platform: platform,
				await appIdentifier: this.$project.getAppIdentifierForPlatform(platform),
				projectFilesPath: projectDir,
				syncWorkingDirectory: projectDir,
				excludedProjectDirsAndFiles: this.excludedProjectDirsAndFiles,
				additionalConfigurations: this.$project.projectInformation.configurations
			};

			this.deviceConfigurationInfos = [];

			let configurations = this.$project.getConfigurationsSpecifiedByUser();

			let $liveSyncServiceBase: ILiveSyncServiceBase = this.$injector.resolve("$liveSyncServiceBase");
			if (!configurations.length) {
				await this.fillDeviceConfigurationInfos(livesyncData.appIdentifier);
				let deviceConfigurations = _.reduce(this.deviceConfigurationInfos, (result, dci) => result + `${EOL}device: ${dci.applicationIdentifier} has "${dci.configuration}" configuration`, "");
				if (deviceConfigurations && _.uniqBy(this.deviceConfigurationInfos, dci => dci.configuration).length !== 1) {
					this.$errors.failWithoutHelp("Cannot LiveSync because application is deployed with different configurations across the devices.", deviceConfigurations);
				}

				livesyncData.configuration = this.deviceConfigurationInfos && this.deviceConfigurationInfos[0] && this.deviceConfigurationInfos[0].configuration;
				if (livesyncData.configuration) {
					this.$options.config = [livesyncData.configuration];
				}

				await $liveSyncServiceBase.sync([livesyncData]);
			} else {
				configurations.forEach(configuration => {
					livesyncData.configuration = configuration;
					livesyncData.appIdentifier = this.$project.projectInformation.configurationSpecificData[configuration.toLowerCase()].AppIdentifier;
					await this.fillDeviceConfigurationInfos(livesyncData.appIdentifier);

					livesyncData.canExecute = (device: Mobile.IDevice): boolean => {
						let deviceConfigurationInfo = _.find(this.deviceConfigurationInfos, dci => dci.deviceIdentifier === device.deviceInfo.identifier);
						if (deviceConfigurationInfo && deviceConfigurationInfo.configuration && deviceConfigurationInfo.configuration.toLowerCase() !== configuration.toLowerCase() && !this.$options.companion) {
							this.$logger.warn(`Cannot LiveSync to device with identifier ${device.deviceInfo.identifier}. You are trying to synchronize changes for the ${configuration} configuration but the device expects changes for the ${deviceConfigurationInfo.configuration} configuration. Change the target configuration for the LiveSync operation or re-build and re-deploy your app in another configuration.`);
							return false;
						}

						return true;
					};

					await $liveSyncServiceBase.sync([livesyncData]);
				});
			}
	}

	private fillDeviceConfigurationInfos(appIdentifier: string): IFuture<void> {
		return this.$devicesService.execute(device => (() => {
			let configInfo = await  device.getApplicationInfo(appIdentifier);
			if (configInfo) {
				this.deviceConfigurationInfos.push(configInfo);
			}
		}).future<void>()());
	}
}
$injector.register("liveSyncService", LiveSyncService);

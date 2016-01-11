///<reference path="../.d.ts"/>
"use strict";

import * as helpers from "../common/helpers";
import * as constants from "../common/mobile/constants";

export class DeployHelper implements IDeployHelper {
	constructor(protected $devicesService: Mobile.IDevicesService,
		protected $logger: ILogger,
		protected $fs: IFileSystem,
		protected $project: Project.IProject,
		protected $buildService: Project.IBuildService,
		protected $liveSyncService: ILiveSyncService,
		protected $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $hostInfo: IHostInfo,
		private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $wp8EmulatorServices: Mobile.IEmulatorPlatformServices) { }

	public deploy(platform?: string): IFuture<void> {
		this.$project.ensureProject();

		if (!this.$project.capabilities.deploy) {
			this.$errors.failWithoutHelp("You will be able to deploy %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
		}
		if(platform && !this.$mobileHelper.isPlatformSupported(platform)) {
			this.$errors.failWithoutHelp("On your current OS, you cannot deploy apps on connected %s devices.", this.$mobileHelper.normalizePlatformName(platform));
		}

		if (this.$options.companion) {
			return this.$liveSyncService.livesync(platform);
		}

		return this.deployCore(platform);
	}

	private deployCore(platform: string): IFuture<void> {
		return ((): void => {
			this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device}).wait();
			platform = platform || this.$devicesService.platform;
			let packageName = this.$project.projectData.AppIdentifier;
			let packageFile: string = null;

			this.$options.justlaunch = true;

			let devices = this.$devicesService.getDevicesForPlatform(platform);
			if (devices.length === 0 || (this.$mobileHelper.isiOSPlatform(platform) && this.$options.emulator &&
				!_.find(devices, d => d.isEmulator) && _.find(devices, d => !d.isEmulator))) { //has only device
				if (this.$hostInfo.isWindows && this.$mobileHelper.isiOSPlatform(platform)) {
					this.$errors.failWithoutHelp(constants.ERROR_NO_DEVICES);
				}

				let emulatorServices = this.resolveEmulatorServices(platform);
				emulatorServices.startEmulator().wait();
				this.$devicesService.reset();
 				this.$devicesService.initialize({platform: platform, deviceId: this.$options.device}).wait();
			}

			let action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					let deploymentTarget = this.$project.projectData.iOSDeploymentTarget;
					if (deploymentTarget && this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
						let deviceVersion = _.take(device.deviceInfo.version.split("."), 2).join(".");
						if (helpers.versionCompare(deviceVersion, deploymentTarget) < 0) {
							this.$logger.error(`You cannot deploy on device ${device.deviceInfo.identifier} with OS version ${deviceVersion} when iOSDeploymentTarget is set to ${deploymentTarget}.`);
							return;
						}
					}

					if (!packageFile) {
						packageFile = this.$devicesService.isiOSSimulator(device) ? this.$buildService.buildForiOSSimulator(this.$options.saveTo, device).wait() :
							this.$buildService.buildForDeploy(this.$devicesService.platform, this.$options.saveTo, false, device).wait();

						this.$logger.debug("Ready to deploy %s", packageFile);
						this.$logger.debug("File is %d bytes", this.$fs.getFileSize(packageFile).wait().toString());
					}

					device.applicationManager.reinstallApplication(packageName, packageFile).wait();
					this.$logger.info(`Successfully deployed on device with identifier '${device.deviceInfo.identifier}'.`);
					if (device.applicationManager.canStartApplication()) {
						device.applicationManager.startApplication(this.$project.projectData.AppIdentifier).wait();
					}
				}).future<void>()();
			};

			let canExecute = (device: Mobile.IDevice): boolean => {
				let hasOnlySimulator = _.find(devices, d => d.isEmulator) && !_.find(devices, d => !d.isEmulator);
				return (hasOnlySimulator || this.$options.emulator) ? this.$devicesService.isiOSSimulator(device) : this.$devicesService.isiOSDevice(device);
			};

			this.$devicesService.execute(action, canExecute).wait();
		}).future<void>()();
	}

	private resolveEmulatorServices(platform: string): Mobile.IEmulatorPlatformServices {
		if (this.$mobileHelper.isAndroidPlatform(platform)) {
			return this.$androidEmulatorServices;
		} else if (this.$mobileHelper.isiOSPlatform(platform)) {
			return this.$iOSEmulatorServices;
		} else if (this.$mobileHelper.isWP8Platform(platform)) {
			return this.$wp8EmulatorServices;
		}

		return null;
	}
}
$injector.register("deployHelper", DeployHelper);

export class DeployCommand implements ICommand {
	constructor(private $deployHelper: IDeployHelper) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy();
	}
}
$injector.registerCommand("deploy|*devices", DeployCommand);

export class DeployAndroidCommand implements ICommand {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(this.$devicePlatformsConstants.Android);
	}
}
$injector.registerCommand("deploy|android", DeployAndroidCommand);

export class DeployIosCommand implements ICommand {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(this.$devicePlatformsConstants.iOS);
	}
}
$injector.registerCommand("deploy|ios", DeployIosCommand);

export class DeployWP8Command implements ICommand {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(this.$devicePlatformsConstants.WP8);
	}

	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand("deploy|wp8", DeployWP8Command);

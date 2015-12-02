///<reference path="../.d.ts"/>
"use strict";

import * as helpers from "../common/helpers";

export class DeployHelper implements IDeployHelper {
	constructor(protected $devicesService: Mobile.IDevicesService,
		protected $logger: ILogger,
		protected $fs: IFileSystem,
		protected $project: Project.IProject,
		protected $buildService: Project.IBuildService,
		protected $liveSyncService: ILiveSyncService,
		protected $errors: IErrors,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions) { }

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
			let packageName = this.$project.projectData.AppIdentifier;
			let packageFile: string = null;

			this.$options.justlaunch = true;

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
						packageFile = this.$buildService.buildForDeploy(this.$devicesService.platform, this.$options.saveTo, false, device).wait();

						this.$logger.debug("Ready to deploy %s", packageFile);
						this.$logger.debug("File is %d bytes", this.$fs.getFileSize(packageFile).wait().toString());
					}
					device.deploy(packageFile, packageName).wait();
					if(device.applicationManager.canStartApplication()) {
						device.applicationManager.startApplication(this.$project.projectData.AppIdentifier).wait();
					}
				}).future<void>()();
			};

			this.$devicesService.execute(action).wait();
		}).future<void>()();
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

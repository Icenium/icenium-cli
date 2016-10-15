import * as helpers from "../common/helpers";
import { EnsureProjectCommandWithoutArgs } from "./ensure-project-command-without-args";

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
		private $hostInfo: IHostInfo) { }

	public deploy(platform?: string): IFuture<void> {
		this.$project.ensureProject();

		if (!this.$project.capabilities.deploy) {
			this.$errors.failWithoutHelp("You will be able to deploy %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
		}
		if (platform && !this.$mobileHelper.isPlatformSupported(platform)) {
			this.$errors.failWithoutHelp("On your current OS, you cannot deploy apps on connected %s devices.", this.$mobileHelper.normalizePlatformName(platform));
		}

		if (this.$options.companion) {
			return this.$liveSyncService.livesync(platform);
		}

		if (platform && !this.$mobileHelper.isiOSPlatform(platform) && this.$options.emulator) {
			// TODO: Support this for Android and WP8 - start new emulator or reuse currently running emulator
			this.$errors.failWithoutHelp(`--emulator option is not supported for ${platform} platform. It is only supported for iOS platform.`);
		}

		return this.deployCore(platform);
	}

	private deployCore(platform: string): IFuture<void> {
		return ((): void => {
			this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device }).wait();
			platform = platform || this.$devicesService.platform;
			this.$options.justlaunch = true;
			let appInfo: IApplicationInformation;

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

					if (!appInfo) {
						appInfo = this.getAppInfoFromBuildResult(device).wait();
					}

					this.$logger.debug("Ready to deploy %s", appInfo.packageName);
					this.$logger.debug("File is %d bytes", this.$fs.getFileSize(appInfo.packageName).wait().toString());

					device.applicationManager.reinstallApplication(appInfo.appIdentifier, appInfo.packageName).wait();
					this.$logger.info(`Successfully deployed on device with identifier '${device.deviceInfo.identifier}'.`);
					if (device.applicationManager.canStartApplication()) {
						device.applicationManager.startApplication(appInfo.appIdentifier).wait();
					}
				}).future<void>()();
			};

			let canExecute = (device: Mobile.IDevice): boolean => {
				if (this.$options.device) {
					return device.deviceInfo.identifier === this.$devicesService.getDeviceByDeviceOption().deviceInfo.identifier;
				}

				if (this.$mobileHelper.isiOSPlatform(platform) && this.$hostInfo.isDarwin) {
					let isiOS = this.$options.emulator ? this.$devicesService.isiOSSimulator(device) : this.$devicesService.isiOSDevice(device);
					return this.$devicesService.isOnlyiOSSimultorRunning() || isiOS;
				}

				return true;
			};

			this.$devicesService.execute(action, canExecute).wait();
		}).future<void>()();
	}

	private getAppInfoFromBuildResult(device: Mobile.IDevice): IFuture<IApplicationInformation> {
		return ((): IApplicationInformation => {
			if (this.$devicesService.isiOSSimulator(device)) {
				return { packageName: this.$buildService.buildForiOSSimulator(this.$options.saveTo, device).wait(), appIdentifier: this.$project.projectData.AppIdentifier };
			} else {
				return this.$buildService.buildForDeploy(this.$devicesService.platform, this.$options.saveTo, false, device).wait();
			}
		}).future<IApplicationInformation>()();
	}
}
$injector.register("deployHelper", DeployHelper);

export class DeployCommand extends EnsureProjectCommandWithoutArgs {
	constructor(private $deployHelper: IDeployHelper,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy();
	}
}
$injector.registerCommand("deploy|*devices", DeployCommand);

export class DeployAndroidCommand extends EnsureProjectCommandWithoutArgs {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(this.$devicePlatformsConstants.Android);
	}
}
$injector.registerCommand("deploy|android", DeployAndroidCommand);

export class DeployIosCommand extends EnsureProjectCommandWithoutArgs {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(this.$devicePlatformsConstants.iOS);
	}
}
$injector.registerCommand("deploy|ios", DeployIosCommand);

export class DeployWP8Command extends EnsureProjectCommandWithoutArgs {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(this.$devicePlatformsConstants.WP8);
	}

	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand("deploy|wp8", DeployWP8Command);

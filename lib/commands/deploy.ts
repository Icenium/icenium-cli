import * as helpers from "../common/helpers";
import { EnsureProjectCommand } from "./ensure-project-command";

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

	public async deploy(platform?: string): Promise<void> {
		await this.$project.ensureProject();

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

		await this.deployCore(platform);
	}

	private async deployCore(platform: string): Promise<void> {
		await this.$devicesService.initialize({ platform: platform, deviceId: this.$options.device, emulator: this.$options.emulator });
		platform = platform || this.$devicesService.platform;
		this.$options.justlaunch = true;
		let appInfo: IApplicationInformation;

		let action = async (device: Mobile.IDevice): Promise<void> => {
			let deploymentTarget = this.$project.projectData.iOSDeploymentTarget;
			if (deploymentTarget && this.$mobileHelper.isiOSPlatform(device.deviceInfo.platform)) {
				let deviceVersion = _.take(device.deviceInfo.version.split("."), 2).join(".");
				if (helpers.versionCompare(deviceVersion, deploymentTarget) < 0) {
					this.$logger.error(`You cannot deploy on device ${device.deviceInfo.identifier} with OS version ${deviceVersion} when iOSDeploymentTarget is set to ${deploymentTarget}.`);
					return;
				}
			}

			if (!appInfo) {
				appInfo = await this.getAppInfoFromBuildResult(device);
			}

			this.$logger.debug("Ready to deploy %s", appInfo.packageName);
			this.$logger.debug("File is %d bytes", this.$fs.getFileSize(appInfo.packageName).toString());

			await device.applicationManager.reinstallApplication(appInfo.appIdentifier, appInfo.packageName);
			this.$logger.info(`Successfully deployed on device with identifier '${device.deviceInfo.identifier}'.`);
			if (device.applicationManager.canStartApplication()) {
				await device.applicationManager.startApplication(appInfo.appIdentifier);
			}
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

		await this.$devicesService.execute(action, canExecute);
	}

	private async getAppInfoFromBuildResult(device: Mobile.IDevice): Promise<IApplicationInformation> {
		if (this.$devicesService.isiOSSimulator(device)) {
			return { packageName: await this.$buildService.buildForiOSSimulator(this.$options.saveTo, device), appIdentifier: this.$project.projectData.AppIdentifier };
		} else {
			return await this.$buildService.buildForDeploy(this.$devicesService.platform, this.$options.saveTo, false, device);
		}
	}
}

$injector.register("deployHelper", DeployHelper);

export class DeployCommand extends EnsureProjectCommand {
	constructor(private $deployHelper: IDeployHelper,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		await this.$deployHelper.deploy();
	}
}

$injector.registerCommand("deploy|*devices", DeployCommand);

export class DeployAndroidCommand extends EnsureProjectCommand {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		await this.$deployHelper.deploy(this.$devicePlatformsConstants.Android);
	}
}

$injector.registerCommand("deploy|android", DeployAndroidCommand);

export class DeployIosCommand extends EnsureProjectCommand {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		await this.$deployHelper.deploy(this.$devicePlatformsConstants.iOS);
	}
}

$injector.registerCommand("deploy|ios", DeployIosCommand);

export class DeployWP8Command extends EnsureProjectCommand {
	constructor(private $deployHelper: IDeployHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		await this.$deployHelper.deploy(this.$devicePlatformsConstants.WP8);
	}

	public isDisabled = this.$config.ON_PREM;
}

$injector.registerCommand("deploy|wp8", DeployWP8Command);

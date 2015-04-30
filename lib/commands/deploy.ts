///<reference path="../.d.ts"/>
"use strict";

import util = require("util");
import Future = require("fibers/future");
import commandParams = require("../common/command-params");

export class DeployHelper implements IDeployHelper {
	constructor(protected $devicesServices: Mobile.IDevicesServices,
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

		return this.deployCore(platform);
	}

	private deployCore(platform: string): IFuture<void> {
		return ((): void => {
			if (this.$options.companion) {
				this.$liveSyncService.livesync(platform).wait();
				return;
			}

			this.$devicesServices.initialize({ platform: platform, deviceId: this.$options.device}).wait();
			let packageName = this.$project.projectData.AppIdentifier;
			let packageFile: string = null;

			let action = (device: Mobile.IDevice): IFuture<void> => {
				if(!packageFile) {
					let packageDefs = this.$buildService.deploy(this.$devicesServices.platform, device).wait();
					packageFile = packageDefs[0].localFile;

					this.$logger.debug("Ready to deploy %s", packageFile);
					this.$logger.debug("File is %d bytes", this.$fs.getFileSize(packageFile).wait().toString());
				}
				return device.deploy(packageFile, packageName);
			};

			this.$devicesServices.execute(action).wait();
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
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(this.$devicePlatformsConstants.WP8);
	}
}
$injector.registerCommand("deploy|wp8", DeployWP8Command);


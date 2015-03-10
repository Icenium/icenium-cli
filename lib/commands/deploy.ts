///<reference path="../.d.ts"/>
"use strict";

import options = require("../common/options");
import util = require("util");
import MobileHelper = require("./../common/mobile/mobile-helper");
import Future = require("fibers/future");
import commandParams = require("../common/command-params");

export class DeployHelper implements IDeployHelper {
	constructor(protected $devicesServices: Mobile.IDevicesServices,
		protected $logger: ILogger,
		protected $fs: IFileSystem,
		protected $project: Project.IProject,
		protected $buildService: Project.IBuildService,
		protected $liveSyncService: ILiveSyncService,
		protected $errors: IErrors) { }

	public deploy(platform?: string): IFuture<void> {
		this.$project.ensureProject();

		if (!this.$project.capabilities.deploy) {
			this.$errors.fail("You will be able to deploy %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
		}
		if(platform && !MobileHelper.isPlatformSupported(platform)) {
			this.$errors.fail("On your current OS, you cannot deploy apps on connected %s devices.", MobileHelper.normalizePlatformName(platform));
		}

		return this.deployCore(platform);
	}

	private deployCore(platform: string): IFuture<void> {
		return ((): void => {
			if (options.companion) {
				this.$liveSyncService.livesync(platform).wait();
				return;
			}

			this.$devicesServices.initialize({ platform: platform, deviceId: options.device}).wait();
			var packageName = this.$project.projectData.AppIdentifier;
			var packageFile: string = null;

			var action = (device: Mobile.IDevice): IFuture<void> => {
				if(!packageFile) {
					var packageDefs = this.$buildService.deploy(this.$devicesServices.platform, device).wait();
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
	constructor(private $deployHelper: IDeployHelper) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.Android]);
	}
}
$injector.registerCommand("deploy|android", DeployAndroidCommand);

export class DeployIosCommand implements ICommand {
	constructor(private $deployHelper: IDeployHelper) {	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.iOS]);
	}
}
$injector.registerCommand("deploy|ios", DeployIosCommand);


export class DeployWP8Command implements ICommand {
	constructor(private $deployHelper: IDeployHelper) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return this.$deployHelper.deploy(MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.WP8]);
	}
}
$injector.registerCommand("deploy|wp8", DeployWP8Command);


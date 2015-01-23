///<reference path="../.d.ts"/>
"use strict";

import options = require("./../options");
import util = require("util");
import MobileHelper = require("./../common/mobile/mobile-helper");
import Future = require("fibers/future");
import iOSDeploymentValidatorLib = require("./../validators/ios-deployment-validator");
import commandParams = require("../common/command-params");


export class DeployCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $project: Project.IProject,
		private $buildService: Project.IBuildService,
		private $commandsService: ICommandsService,
		private $errors: IErrors,
		private $stringParameter: ICommandParameter) { }

	public allowedParameters = [this.$stringParameter];

	public execute(args: string[]): IFuture<void> {
		return ((): void => {
			this.$project.ensureProject();

			if (!this.$project.capabilities.deploy) {
				this.$errors.fail("You will be able to deploy %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}
			if (args[0] && !MobileHelper.isPlatformSupported(args[0])) {
				this.$errors.fail("On your current OS, you cannot deploy apps on connected %s devices.", MobileHelper.normalizePlatformName(args[0]));
			}

			this.deployCore(args).wait();
		}).future<void>()();
	}

	private deployCore(args: string[]): IFuture<void> {
		return ((): void => {
			if (options.companion) {
				this.$logger.warn("No deployment necessary when using AppBuilder companion." +
					" Use the `livesync` command instead to avoid this warning.");
				this.$commandsService.executeCommandUnchecked("livesync", args).wait();
				return;
			}

			this.$devicesServices.initialize({platform: args[0], deviceId: options.device}).wait();
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

	get completionData(): string[] {
		return _.map(MobileHelper.PlatformNames, (platformName: string) => platformName.toLowerCase());
	}
}
$injector.registerCommand("deploy", DeployCommand);

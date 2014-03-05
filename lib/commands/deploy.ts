///<reference path="../.d.ts"/>

import options = require("./../options");
import util = require("util");
import MobileHelper = require("./../mobile/mobile-helper");
import Future = require("fibers/future");
import iOSDeploymentValidatorLib = require("./../validators/ios-deployment-validator");

export class DeployCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $project: Project.IProject,
		private $commandsService: ICommandsService,
		private $injector: IInjector) { }

	public execute(args: string[]): IFuture<void> {
		return ((): void => {
			if (options.companion) {
				this.$logger.warn("No deployment necessary when using AppBuilder companion." +
					" Use the `live-sync` command instead to avoid this warning.")
				this.$commandsService.executeCommandUnchecked("live-sync", args);
				return;
			}

			var platform = this.$devicesServices.checkPlatformAndDevice(args[0], options.device).wait();
			if (this.$devicesServices.hasDevices(platform)) {
				var canExecute = (device: Mobile.IDevice): boolean => {
					if (MobileHelper.isiOSPlatform(device.getPlatform())) {
						var iOSDeploymentValidator = this.$injector.resolve(iOSDeploymentValidatorLib.IOSDeploymentValidator, {appIdentifier: packageName, device: device});
						iOSDeploymentValidator.throwIfInvalid({provisionOption: options.provision, certificateOption: options.certificate}).wait();
					}
					return true;
				}

				var packageDefs = this.$project.deploy(platform).wait();
				var packageFile = packageDefs[0].localFile;

				this.$logger.debug("Ready to deploy %s", packageDefs);
				this.$logger.debug("File is %d bytes", this.$fs.getFileSize(packageFile).wait());

				var packageName = this.$project.projectData.AppIdentifier;

				var action = (device: Mobile.IDevice): IFuture<void> => {
					return device.deploy(packageFile, packageName);
				};

				if(options.device) {
					this.$devicesServices.executeOnDevice(action, options.device).wait();
				} else {
					this.$devicesServices.executeOnAllConnectedDevices(action, platform, canExecute).wait();
				}
			}
		}).future<void>()();
	}
}
$injector.registerCommand("deploy", DeployCommand);



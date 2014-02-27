///<reference path="../.d.ts"/>

import options = require("./../options");
import util = require("util");
import MobileHelper = require("./../mobile/mobile-helper");
import Future = require("fibers/future");

export class DeployCommand implements ICommand {
	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $identityManager: Server.IIdentityManager,
		private $fs: IFileSystem,
		private $project: Project.IProject,
		private $errors: IErrors) { }

	public execute(args: string[]): IFuture<void> {
		return (() => {
			var platform = args[0];
			if (this.$devicesServices.hasDevices(platform)) {
				var provisionData;
				if (options.provision) {
					provisionData = this.$identityManager.findProvision(options.provision).wait();
				}

				var canExecute = (device: Mobile.IDevice): boolean => {
					if (MobileHelper.isiOSPlatform(device.getPlatform())) {
						var isInProvisionedDevices: boolean = provisionData.ProvisionedDevices && provisionData.ProvisionedDevices.contains(device.getIdentifier());
						if(!isInProvisionedDevices) {
							this.$errors.fail("The device with identifier '%s' is not included in provisioned devices for given provision. Please use $ appbuilder list-provision -v to list all devices included in provision",
								device.getIdentifier());
						}
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



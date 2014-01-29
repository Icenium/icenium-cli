///<reference path="../.d.ts"/>

import options = require("./../options");
import fs = require("fs");
import util = require("util");
import MobileHelper = require("./../mobile/mobile-helper");
import Future = require("fibers/future");

export class DeployCommand implements ICommand {
    constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $identityManager: Server.IIdentityManager,
		private $project: Project.IProject) {
	}

	public execute(args: string[]): void {
		var platform = args[0];
		if (this.$devicesServices.hasDevices(platform)) {
			var canExecute;

			if (MobileHelper.isiOSPlatform(platform)) {
				var provisionData = this.$identityManager.findProvision(options["provision"]).wait();
				canExecute = (device: Mobile.IDevice): boolean => {
					var isInProvisionedDevices: boolean = provisionData.ProvisionedDevices !== undefined && provisionData.ProvisionedDevices.contains(device.getIdentifier());
					if(!isInProvisionedDevices) {
						throw new Error(util.format("The device with identifier '%s' is not included in provisioned devices for given provision. Please use $ ice list-provision -v to list all devices included in provision"));
					}

					return true;
				}
			}

			var packageDefs = this.$project.executeBuild(platform).wait();
			var packageFile = packageDefs[0].localFile;

			this.$logger.debug("Ready to deploy %s", packageDefs);
			this.$logger.debug("File is %d bytes", fs.statSync(packageFile).size);

			var packageName = this.$project.projectData().AppIdentifier;

			var action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => { device.deploy(packageFile, packageName); }).future<void>()();
			};
			this.$devicesServices.executeOnAllConnectedDevices(action, platform, canExecute).wait();
		}
	}
}
$injector.registerCommand("deploy", DeployCommand);



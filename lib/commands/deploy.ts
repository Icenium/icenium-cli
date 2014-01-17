///<reference path="../.d.ts"/>

import project = require("./../project");
import options = require("./../options");
import fs = require("fs");
import util = require("util");
import MobileHelper = require("./../mobile/mobile-helper");
import Future = require("fibers/future");

export class DeployCommandData implements Commands.ICommandData {
	constructor(private keywords: string[]) { }
	public get Keywords() {
		return this.keywords;
    }
}

export class DeployCommandDataFactory implements Commands.ICommandDataFactory {
	public fromCliArguments(args: string[]): DeployCommandData {
		return new DeployCommandData(args);
	}
}

$injector.register("deployCommandDataFactory", DeployCommandDataFactory);

export class DeployCommand implements Commands.ICommand<DeployCommandData> {
    constructor(private deployCommandDataFactory: DeployCommandDataFactory,
				private devicesServices: Mobile.IDevicesServices,
				private logger: ILogger) { }

	public getDataFactory(): DeployCommandDataFactory {
		return this.deployCommandDataFactory;
	}

	public canExecute(): boolean {
		return true;
	}

	public execute(data: DeployCommandData): void {
		var platform = data.Keywords.length === 0 ? undefined : data.Keywords[0];

		if (this.devicesServices.hasDevices(platform)) {
			var canExecute;

			if(platform === MobileHelper.DevicePlatforms[MobileHelper.DevicePlatforms.iOS]) {
				var identityMgr = $injector.resolve("identityManager");
				var provisionData = identityMgr.findProvision(options["provision"]).wait();
				canExecute = (device: Mobile.IDevice): boolean => {
					var isInProvisionedDevices: boolean = provisionData.ProvisionedDevices !== undefined && provisionData.ProvisionedDevices.contains(device.getIdentifier());
					if(!isInProvisionedDevices) {
						throw new Error(util.format("The device with identifier '%s' is not included in provisioned devices for given provision. Please use $ ice list-provision -v to list all devices included in provision"));
					}

					return true;
				}
			}

			var packageDefs = project.build(platform, null, false, true).wait();
			var packageFile = packageDefs[0].localFile;

			this.logger.debug("Ready to deploy %s", packageDefs);
			this.logger.debug("File is %d bytes", fs.statSync(packageFile).size);

			var packageName = project.getProjectData().AppIdentifier;

			var action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => { device.deploy(packageFile, packageName); }).future<void>()();
			};
			this.devicesServices.executeOnAllConnectedDevices(action, platform, canExecute).wait();
		}
	}
}

$injector.registerCommand("deploy", DeployCommand);



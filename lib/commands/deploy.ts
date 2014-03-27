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
		private $buildService: Project.IBuildService,
		private $commandsService: ICommandsService) { }

	public execute(args: string[]): IFuture<void> {
		return ((): void => {
			if (options.companion) {
				this.$logger.warn("No deployment necessary when using AppBuilder companion." +
					" Use the `livesync` command instead to avoid this warning.")
				this.$commandsService.executeCommandUnchecked("livesync", args);
				return;
			}

			this.$devicesServices.initialize(args[0], options.device).wait();
			this.$project.ensureProject();
			var packageName = this.$project.projectData.AppIdentifier;
			var packageFile: string = null;

			var action = (device: Mobile.IDevice): IFuture<void> => {
				if(!packageFile) {
					var packageDefs = this.$buildService.deploy(this.$devicesServices.platform, device).wait();
					packageFile = packageDefs[0].localFile;

					this.$logger.debug("Ready to deploy %s", packageDefs);
					this.$logger.debug("File is %d bytes", this.$fs.getFileSize(packageFile).wait());
				}
				return device.deploy(packageFile, packageName);
			};

			this.$devicesServices.execute(action).wait();

		}).future<void>()();
	}
}
$injector.registerCommand("deploy", DeployCommand);



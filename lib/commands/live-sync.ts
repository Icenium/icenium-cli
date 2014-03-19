///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import watchr = require("watchr");
import options = require("./../options");
import helpers = require("./../helpers");
import MobileHelper = require("./../mobile/mobile-helper");

export class LiveSyncCommand implements ICommand {
	private excludedProjectDirsAndFiles = ["app_resources", "plugins"];

	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $project: Project.IProject) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$devicesServices.initialize(args[0], options.device).wait();

			this.$project.ensureProject();
			var projectDir = this.$project.getProjectDir();

			var appIdentifier = options.companion
				? "com.telerik.Icenium"
				: this.$project.projectData.AppIdentifier;

			if (options.watch) {
				this.liveSyncDevices(this.$devicesServices.platform, projectDir, appIdentifier);

				process.stdin.once("data", () => {});
				process.stdin.on("end", () => process.exit());
			} else {
				if (options.file) {
					var isExistFile = this.$fs.exists((options.file)).wait();
					if(isExistFile) {
						var projectFiles = [path.resolve(options.file)];
						this.sync(appIdentifier, projectDir, projectFiles).wait();
					} else {
						this.$errors.fail("The file %s does not exist.", options.file);
					}
				} else {
					var projectFiles = this.$project.enumerateProjectFiles(this.excludedProjectDirsAndFiles);
					this.sync(appIdentifier, projectDir, projectFiles).wait();
				}
			}
		}).future<void>()();
	}

	private sync(appIdentifier: string, projectDir: string, projectFiles: string[]): IFuture<void> {
		return(() => {
			var canExecute = (device: Mobile.IDevice): boolean => {
				if (!MobileHelper.isiOSPlatform(device.getPlatform()) && options.companion) {
					this.$logger.warn("The AppBuilder Companion app is available only for iOS devices.");
				}

				return true;
			}

			var action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					var platformSpecificProjectPath = device.getDeviceProjectPath(appIdentifier);
					var localDevicePaths = this.getLocalToDevicePaths(projectDir, projectFiles, platformSpecificProjectPath);
					device.sync(localDevicePaths, appIdentifier).wait();
				}).future<void>()();
			};

			this.$devicesServices.execute(action, canExecute).wait();
		}).future<void>()();
	}

	public getLocalToDevicePaths(localProjectPath, projectFiles, deviceProjectPath): MobileHelper.LocalToDevicePathData[] {
		var localToDevicePaths = _.map(projectFiles, (projectFile: string) => {
			var relativeToProjectBasePath: string = helpers.getRelativeToRootPath(localProjectPath, projectFile);
			var deviceDirPath : string = path.dirname(path.join(deviceProjectPath, relativeToProjectBasePath));
			return new MobileHelper.LocalToDevicePathData(projectFile, helpers.fromWindowsRelativePathToUnix(deviceDirPath), relativeToProjectBasePath);
		});

		return localToDevicePaths;
	}

	private liveSyncDevices(platform, projectDir, appIdentifier) {
		watchr.watch({
			paths: [projectDir],
			listeners: {
				error: (error) => {
					this.$errors.fail(error);
				},
				change: (changeType, filePath) => {
					if (!this.$project.isProjectFileExcluded(projectDir, filePath, this.excludedProjectDirsAndFiles)) {
						this.$logger.trace("Syncing %s", filePath);
						this.sync(appIdentifier, projectDir, [filePath]);
					}
				},
				next: (error, watchers) => {
					if(error) {
						this.$errors.fail(error);
					}
					this.$logger.trace("File system watchers are stopping.");
					for (var i = 0; i < watchers.length; i++) {
						watchers[i].close();
					}
					this.$logger.trace("File system watchers are stopped.");
				}
			}
		});
	}
}
$injector.registerCommand("livesync", LiveSyncCommand);



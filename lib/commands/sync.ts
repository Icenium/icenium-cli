///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import watchr = require("watchr");
import project = require("./../project");
import options = require("./../options");
import helpers = require("./../helpers");
import _ = require("underscore");
import MobileHelper = require("./../mobile/mobile-helper");

export class SyncCommandData implements Commands.ICommandData {
	constructor(private keywords: string[]) { }
	public get Platform() {
		return this.keywords[0];
	}
}

export class SyncCommandDataFactory implements Commands.ICommandDataFactory {
	public fromCliArguments(args: string[]): SyncCommandData {
		return new SyncCommandData(args);
	}
}
$injector.register("syncCommandDataFactory", SyncCommandDataFactory);

export class SyncCommand implements Commands.ICommand<SyncCommandData> {
	private excludedProjectDirsAndFiles = [".ice", "app_resources", ".iceproject", "plugins"];

	constructor(private $syncCommandDataFactory: SyncCommandDataFactory,
		private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $fs: IFileSystem) { }

	public getDataFactory(): SyncCommandDataFactory {
		return this.$syncCommandDataFactory;
	}

	public canExecute(): boolean {
		return true;
	}

	public execute(data: SyncCommandData): void {
		if (!data.Platform) {
			throw new Error("Please specify platform");
		}

		var projectDir = project.getProjectDir();
		var appIdentifier = project.getProjectData().AppIdentifier;

		if(this.$devicesServices.hasDevices(data.Platform)) {
			if (options.live) {
				this.liveSyncDevices(data.Platform, projectDir, appIdentifier);
			} else {
				if (options.file) {
					var isExistFile = this.$fs.exists((options.file)).wait();
					if(isExistFile) {
						var projectFiles = [path.resolve(options.file)];
						this.sync(data.Platform, appIdentifier, projectDir, projectFiles);
					} else {
						console.log(util.format("The file %s does not exist.", options.file));
					}
				} else {
					var projectFiles = project.enumerateProjectFiles(this.excludedProjectDirsAndFiles);
					this.sync(data.Platform, appIdentifier, projectDir, projectFiles);
				}
			}
		}
	}

	private sync(platform: string, appIdentifier: string, projectDir: string, projectFiles: string[]) {
		var action = (device: Mobile.IDevice): IFuture<void> => {
			return (() => {
				var platformSpecificProjectPath = device.getDeviceProjectPath(appIdentifier);
				var localDevicePaths = this.getLocalToDevicePaths(projectDir, projectFiles, platformSpecificProjectPath);
				device.sync(localDevicePaths, appIdentifier);
			}).future<void>()();
		};

		this.$devicesServices.executeOnAllConnectedDevices(action, platform).wait();
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
					this.$logger.trace(error);
				},
				change: (changeType, filePath) => {
					if (!project.isProjectFileExcluded(projectDir, filePath, this.excludedProjectDirsAndFiles)) {
						this.$logger.trace(util.format("Syncing %s", filePath));
						var successMessage = util.format("%s has been successfully synced.", filePath);
						this.sync(platform, appIdentifier, projectDir, [filePath]);
					}
				},
				next: (error, watchers) => {
					if(error) {
						throw error;
					}
					this.$logger.trace("File system whatchers are stopping.");
					for (var i = 0; i < watchers.length; i++) {
						watchers[i].close();
					}
					this.$logger.trace("File system whatchers are stopped.");
				}
			}
		});
	}
}
$injector.registerCommand("sync", SyncCommand);



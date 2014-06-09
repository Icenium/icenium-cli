///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import watchr = require("watchr");
var options: any = require("./../options");
import helpers = require("./../helpers");
import MobileHelper = require("./../mobile/mobile-helper");
import AppIdentifier = require("../mobile/app-identifier");
import constants = require("../mobile/constants");

interface IPlatformSpecificFileName {
	platform: string;
	onDeviceName: string;
}

export class LiveSyncCommand implements ICommand {
	private excludedProjectDirsAndFiles = [
		"app_resources"
		, "plugins"
		, ".*.tmp"
	];

	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $project: Project.IProject,
		private $dispatcher: IFutureDispatcher,
		private $projectTypes: IProjectTypes) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureProject();

			this.$devicesServices.initialize(args[0], options.device).wait();
			var platform = this.$devicesServices.platform;

			if (!MobileHelper.platformCapabilities[platform].companion && options.companion) {
				this.$errors.fail("The AppBuilder Companion app is not available on %s devices.", platform);
			}

			if (!this.$devicesServices.hasDevices) {
				this.$errors.fail({formatStr: constants.ERROR_NO_DEVICES, suppressCommandHelp: true});
			}

			if (!this.$project.capabilities.livesync && !options.companion) {
				this.$errors.fail("You will be able to LiveSync %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.projectType);
			}

			if (!this.$project.capabilities.livesyncCompanion && options.companion) {
				this.$errors.fail("You will be able to LiveSync %s based applications to the Companion app in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.projectType);
			}

			var projectDir = this.$project.getProjectDir();

			var appIdentifier = AppIdentifier.createAppIdentifier(platform,
				this.$project.projectData.AppIdentifier, options.companion, this.$project.projectType);

			if (options.file) {
				var isExistFile = this.$fs.exists(options.file).wait();
				if (isExistFile) {
					if (LiveSyncCommand.shouldIncludeFile(platform, options.file)) {
						var projectFiles = [path.resolve(options.file)];
						this.sync(appIdentifier, projectDir, projectFiles).wait();
					}
				} else {
					this.$errors.fail("The file %s does not exist.", options.file);
				}
			} else {
				var projectFiles = this.$project.enumerateProjectFiles(this.excludedProjectDirsAndFiles).wait();
				projectFiles = _.filter(projectFiles, (fileName) => LiveSyncCommand.shouldIncludeFile(platform, fileName));

				this.sync(appIdentifier, projectDir, projectFiles).wait();

				if (options.watch) {
					this.liveSyncDevices(platform, projectDir, appIdentifier);
					helpers.exitOnStdinEnd();
					this.$dispatcher.run();
				}
			}
		}).future<void>()();
	}

	private static shouldIncludeFile(platform: string, fileName: string): boolean {
		var platformInfo = LiveSyncCommand.parsePlatformSpecificFileName(fileName);
		return !platformInfo || platformInfo.platform === platform;
	}

	private static parsePlatformSpecificFileName(fileName: string): IPlatformSpecificFileName {
		var platforms = MobileHelper.PlatformNames.join("|");
		var regex = util.format("^(.+?)\.(%s)(\..+?)$", platforms);
		var parsed = fileName.match(new RegExp(regex, "i"));
		if (parsed) {
			var result = {
				platform: MobileHelper.normalizePlatformName(parsed[2]),
				onDeviceName: parsed[1] + parsed[3]
			};
			return result;
		}
		return undefined;
	}

	private sync(appIdentifier: Mobile.IAppIdentifier, projectDir: string, projectFiles: string[]): IFuture<void> {
		return(() => {
			var action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					var platformSpecificProjectPath = appIdentifier.deviceProjectPath;
					var localDevicePaths = this.getLocalToDevicePaths(projectDir, projectFiles, platformSpecificProjectPath);
					device.sync(localDevicePaths, appIdentifier, this.$project.projectType).wait();
				}).future<void>()();
			};

			this.$devicesServices.execute(action).wait();
		}).future<void>()();
	}

	private getLocalToDevicePaths(localProjectPath: string, projectFiles: string[], deviceProjectPath: string): MobileHelper.LocalToDevicePathData[] {
		var localToDevicePaths = _.map(projectFiles, (projectFile: string) => {
			var platformInfo = LiveSyncCommand.parsePlatformSpecificFileName(projectFile);
			var renamedFile = platformInfo ? platformInfo.onDeviceName : projectFile;

			var relativeToProjectBasePath = helpers.getRelativeToRootPath(localProjectPath, renamedFile);
			var devicePath = path.join(deviceProjectPath, relativeToProjectBasePath);
			return new MobileHelper.LocalToDevicePathData(projectFile, helpers.fromWindowsRelativePathToUnix(devicePath), relativeToProjectBasePath);
		});

		return localToDevicePaths;
	}

	private liveSyncDevices(platform: string, projectDir: string, appIdentifier: Mobile.IAppIdentifier): void {
		watchr.watch({
			paths: [projectDir],
			listeners: {
//				log: (logLevel, ...args) => {
//					this.$logger.debug.apply(this.$logger, args);
//				},
				error: (error) => {
					this.$errors.fail(error);
				},
				change: (changeType, filePath) => {
					if (!this.$project.isProjectFileExcluded(projectDir, filePath, this.excludedProjectDirsAndFiles)) {
						this.$logger.trace("Syncing %s", filePath);
						if (LiveSyncCommand.shouldIncludeFile(this.$devicesServices.platform, filePath)) {
							this.$dispatcher.dispatch(() => this.sync(appIdentifier, projectDir, [filePath]));
						}
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
$injector.registerCommand(["livesync|*devices", "live-sync|*devices"], LiveSyncCommand);

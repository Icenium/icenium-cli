///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import watchr = require("watchr");
var options: any = require("./../options");
import helpers = require("./../helpers");
import MobileHelper = require("./../mobile/mobile-helper");
import AppIdentifier = require("../mobile/app-identifier");
import constants = require("../mobile/constants");

export class LiveSyncCommand implements ICommand {
	private excludedProjectDirsAndFiles = [
		"app_resources"
		, "plugins"
		, "cordova.*.js"
		, ".*.tmp"
	];

	constructor(private $devicesServices: Mobile.IDevicesServices,
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $errors: IErrors,
		private $project: Project.IProject,
		private $dispatcher: IFutureDispatcher) {
	}

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$devicesServices.initialize(args[0], options.device).wait();
			var platform = this.$devicesServices.platform;

			if (!MobileHelper.platformCapabilities[platform].companion && options.companion) {
				this.$errors.fail("The AppBuilder Companion app is not available on %s devices.", platform);
			}

			if (!this.$devicesServices.hasDevices) {
				this.$errors.fail({formatStr: constants.ERROR_NO_DEVICES, suppressCommandHelp: true});
			}

			this.$project.ensureProject();
			var projectDir = this.$project.getProjectDir();

			var appIdentifier = AppIdentifier.createAppIdentifier(platform,
				this.$project.projectData.AppIdentifier, options.companion);

			if (options.file) {
				var isExistFile = this.$fs.exists(options.file).wait();
				if(isExistFile) {
					var projectFiles = [path.resolve(options.file)];
					this.sync(appIdentifier, projectDir, projectFiles).wait();
				} else {
					this.$errors.fail("The file %s does not exist.", options.file);
				}
			} else {
				this.uploadCordovaJs(appIdentifier, projectDir, platform).wait();

				var projectFiles = this.$project.enumerateProjectFiles(this.excludedProjectDirsAndFiles);
				this.sync(appIdentifier, projectDir, projectFiles).wait();

				if (options.watch) {
					this.liveSyncDevices(platform, projectDir, appIdentifier);
					helpers.exitOnStdinEnd();
					this.$dispatcher.run();
				}
			}
		}).future<void>()();
	}

	private uploadCordovaJs(appIdentifier: Mobile.IAppIdentifier, projectDir: string, platform: string): IFuture<void> {
		return this.$devicesServices.execute((device) => {
			return (() => {
				var cordovaJs = this.getLocalToDevicePaths(projectDir,
					[path.join(projectDir, util.format("cordova.%s.js", platform))],
					appIdentifier.deviceProjectPath,
					(from) => path.join(path.dirname(from), "cordova.js"));
				device.sync(cordovaJs, appIdentifier, {skipRefresh: true}).wait();
			}).future<void>()();
		});
	}

	private sync(appIdentifier: Mobile.IAppIdentifier, projectDir: string, projectFiles: string[]): IFuture<void> {
		return(() => {
			var action = (device: Mobile.IDevice): IFuture<void> => {
				return (() => {
					var platformSpecificProjectPath = appIdentifier.deviceProjectPath;
					var localDevicePaths = this.getLocalToDevicePaths(projectDir, projectFiles, platformSpecificProjectPath);
					device.sync(localDevicePaths, appIdentifier).wait();
				}).future<void>()();
			};

			this.$devicesServices.execute(action).wait();
		}).future<void>()();
	}

	public getLocalToDevicePaths(localProjectPath: string, projectFiles: string[], deviceProjectPath: string, rename?: (from: string) => string): MobileHelper.LocalToDevicePathData[] {
		var localToDevicePaths = _.map(projectFiles, (projectFile: string) => {
			var renamedFile = rename ? rename(projectFile) : projectFile;

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
						this.$dispatcher.dispatch(() => this.sync(appIdentifier, projectDir, [filePath]));
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
$injector.registerCommand(["livesync", "live-sync"], LiveSyncCommand);

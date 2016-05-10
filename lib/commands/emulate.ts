import * as path from "path";
import { EnsureProjectCommand } from "./ensure-project-command";
import {Configurations} from "../common/constants";

export class EmulateAndroidCommand extends EnsureProjectCommand {
	constructor(private $buildService: Project.IBuildService,
		private $androidEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureAllPlatformAssets().wait();
			this.$androidEmulatorServices.checkAvailability().wait();
			let tempDir = this.$project.getTempDir("emulatorfiles").wait();
			let packageFilePath = path.join(tempDir, "package.apk");
			this.$buildService.build({
				platform: this.$devicePlatformsConstants.Android,
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();
			this.$options.justlaunch = true;
			this.$androidEmulatorServices.runApplicationOnEmulator(packageFilePath, <Mobile.IEmulatorOptions>{ appId: this.$project.projectData.AppIdentifier }).wait();
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			super.canExecute(args).wait();
			this.$androidEmulatorServices.checkDependencies().wait();
			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand("emulate|android", EmulateAndroidCommand);

export class EmulateIosCommand extends EnsureProjectCommand {
	constructor(private $fs: IFileSystem,
		private $buildService: Project.IBuildService,
		private $iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $options: IOptions,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);

	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureAllPlatformAssets().wait();
			this.$iOSEmulatorServices.checkDependencies().wait();
			this.$iOSEmulatorServices.checkAvailability().wait();
			let app = "";

			if (!this.$options.availableDevices) {
				let tempDir = this.$project.getTempDir("emulatorfiles").wait();
				app = this.$buildService.buildForiOSSimulator(path.join(tempDir, "package.ipa")).wait();
			}

			this.$iOSEmulatorServices.runApplicationOnEmulator(app, { appId: this.$project.projectData.AppIdentifier }).wait();

		}).future<void>()();
	}
}
$injector.registerCommand("emulate|ios", EmulateIosCommand);

export class EmulateWp8Command extends EnsureProjectCommand {
	constructor(private $buildService: Project.IBuildService,
		private $wp8EmulatorServices: Mobile.IEmulatorPlatformServices,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $config: Config.IConfig,
		$project: Project.IProject,
		$errors: IErrors) {
		super($project, $errors);
	}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureAllPlatformAssets().wait();
			this.$wp8EmulatorServices.checkDependencies().wait();
			this.$wp8EmulatorServices.checkAvailability().wait();

			let tempDir = this.$project.getTempDir("emulatorfiles").wait();
			let packageFilePath = path.join(tempDir, "package.xap");
			this.$buildService.build({
				platform: this.$devicePlatformsConstants.WP8,
				projectConfiguration: Configurations.Debug,
				buildConfiguration: Configurations.Debug,
				showQrCodes: false,
				downloadFiles: true,
				downloadedFilePath: packageFilePath
			}).wait();

			this.$wp8EmulatorServices.runApplicationOnEmulator(packageFilePath).wait();
		}).future<void>()();
	}

	public isDisabled = this.$config.ON_PREM;
}
$injector.registerCommand("emulate|wp8", EmulateWp8Command);

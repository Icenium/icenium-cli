import constants = require("../../common/mobile/constants");

export class LiveSyncService implements ILiveSyncService {
	private excludedProjectDirsAndFiles = ["app_resources", "plugins", ".*.tmp", ".ab"];

	constructor(private $devicesService: Mobile.IDevicesService,
		private $errors: IErrors,
		private $project: Project.IProject,
		private $mobileHelper: Mobile.IMobileHelper,
		private $options: IOptions,
		private $injector: IInjector) { }

	public livesync(platform?: string): IFuture<void> {
		return (() => {
			this.$project.ensureProject();
			let $liveSyncServiceBase = this.$injector.resolve("$liveSyncServiceBase");
			platform = $liveSyncServiceBase.getPlatform(platform).wait();

			if (!this.$mobileHelper.getPlatformCapabilities(platform).companion && this.$options.companion) {
				this.$errors.failWithoutHelp("The AppBuilder Companion app is not available on %s devices.", platform);
			}

			if (!this.$devicesService.hasDevices) {
				this.$errors.failWithoutHelp(constants.ERROR_NO_DEVICES);
			}

			if (!this.$project.capabilities.livesync && !this.$options.companion) {
				this.$errors.failWithoutHelp("Use $ appbuilder livesync cloud to sync your application to Telerik Nativescript Companion App. You will be able to LiveSync %s based applications in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			if (!this.$project.capabilities.livesyncCompanion && this.$options.companion) {
				this.$errors.failWithoutHelp("You will be able to LiveSync %s based applications to the Companion app in a future release of the Telerik AppBuilder CLI.", this.$project.projectData.Framework);
			}

			let projectDir = this.$project.getProjectDir().wait();

			let livesyncData = {
				platform: platform,
				appIdentifier: this.$project.projectData.AppIdentifier,
				projectFilesPath: projectDir,
				syncWorkingDirectory: projectDir,
				excludedProjectDirsAndFiles: this.excludedProjectDirsAndFiles
			};

			$liveSyncServiceBase.sync(livesyncData).wait();

		}).future<void>()();
	}
}
$injector.register("liveSyncService", LiveSyncService);

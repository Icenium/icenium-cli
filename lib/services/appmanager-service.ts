import * as constants from "../common/constants";
import {EOL} from "os";
import * as helpers from "../helpers";
let Table = require("cli-table");

class AppManagerService implements IAppManagerService {
	private static LIVEPATCH_PLUGIN_ID = "com.telerik.LivePatch";

	constructor(
		private $config: IConfiguration,
		private $server: Server.IServer,
		private $errors: IErrors,
		private $logger: ILogger,
		private $project: Project.IProject,
		private $loginManager: ILoginManager,
		private $opener: IOpener,
		private $buildService: Project.IBuildService,
		private $progressIndicator: IProgressIndicator,
		private $mobileHelper: Mobile.IMobileHelper,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $options: IOptions,
		private $injector: IInjector) { }

	public upload(platform: string): IFuture<void> {
		return (() => {
			let mobilePlatform = this.$mobileHelper.validatePlatformName(platform);
			this.$project.ensureProject();
			this.$loginManager.ensureLoggedIn().wait();

			this.$logger.info("Accessing Telerik AppManager.");
			this.$server.tam.verifyStoreCreated().wait();

			this.$logger.info("Building release package.");
			let buildResult = this.$buildService.build({
				platform: mobilePlatform,
				buildConfiguration: constants.Configurations.Release,
				projectConfiguration: constants.Configurations.Release,
				provisionTypes: [constants.ProvisionType.Development, constants.ProvisionType.Enterprise, constants.ProvisionType.AdHoc],
				showWp8SigningMessage: false,
				buildForTAM: true,
				downloadFiles: this.$options.download
			}).wait();

			buildResult = _.filter(buildResult, (def: Server.IPackageDef) => !def.disposition || def.disposition === "BuildResult");
			if(!buildResult[0] || !buildResult[0].solutionPath) {
				this.$errors.fail({ formatStr: "Build failed.", suppressCommandHelp: true });
			}

			this.$logger.info("Uploading package to Telerik AppManager.");
			let projectName = this.$project.projectData.ProjectName;
			let solutionPath = buildResult[0].solutionPath;
			let projectPath = solutionPath.substr(solutionPath.indexOf("/") + 1);

			let publishSettings: Server.PublishSettings = {
				IsPublished: this.$options.publish,
				IsPublic: this.$options.public,
				NotifyByPush: this.$options.sendPush,
				NotifyByEmail: this.$options.sendEmail,
				Groups: []
			};

			if (this.$options.group) {
				publishSettings.Groups = this.findGroups(this.$options.group).wait();
			}

			if(!this.$options.publish && this.$options.public) {
				this.$logger.warn("You have not set the --publish switch. Your app will become publicly available after you publish it manually in Telerik AppManager.");
			}

			if(!this.$options.publish && this.$options.sendEmail) {
				this.$logger.warn("You have not set the --publish switch. Your users will not receive an email.");
			}

			if(!this.$options.publish && this.$options.sendPush) {
				this.$logger.warn("You have not set the --publish switch. Your users will not receive a push notification.");
			}

			let uploadedAppData: Server.UploadedAppData = this.$server.tam.uploadApplication1(projectName, projectName, projectPath, publishSettings).wait();
			this.$logger.info("Successfully uploaded package.");

			if(this.$options.publish && this.$options.public){
				this.$logger.info("Your app has been published successfully and is now available to download and install from: %s", uploadedAppData.InstallUrl);
			}

			this.openAppManagerStore();
		}).future<void>()();
	}

	public getGroups(): IFuture<void> {
		return (() => {
			this.$loginManager.ensureLoggedIn().wait();

			this.$logger.info("Accessing Telerik AppManager.");
			this.$logger.info("Retrieving distribution groups from Telerik AppManager.");
			let groups = this.$server.tam.getGroups().wait();

			if (!groups.length) {
				this.$logger.info("Cannot find distribution groups.");
				return;
			}

			let table = new Table({
				head: ["Index", "Name"],
				chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''}
			});

			_.forEach(groups, (group, index) => {
				table.push([(index + 1).toString(), group.Name]);
			});

			this.$logger.out(table.toString());

		}).future<void>()();
	}

	public openAppManagerStore(): void {
		let tamUrl = `${this.$config.AB_SERVER_PROTO}://${this.$config.AB_SERVER}/appbuilder/Services/tam`;
		this.$logger.info("Go to %s to manage your apps.", tamUrl);
		this.$opener.open(tamUrl);
	}

	public publishLivePatch(platforms: string[]): IFuture<void> {
		return (() => {
			this.$project.ensureCordovaProject();
			this.$loginManager.ensureLoggedIn().wait();

			platforms = _.map(platforms, platform => this.$mobileHelper.normalizePlatformName(platform));

			let cachedOptionsRelease = this.$options.release;
			this.$options.release = true;

			this.configureLivePatchPlugin().wait();

			this.$logger.warn("If you have not published an AppManager LiveSync-enabled version of this app before, you will not be able to distribute an AppManager LiveSync update for it.");
			this.$logger.info("To learn how to create a new version enabled for AppManager LiveSync, run `$ appbuilder help appmanager livesync`");

			this.$project.importProject().wait();
			this.$logger.printInfoMessageOnSameLine("Publishing patch for " + platforms.join(", ") + "...");

			let patchData = <any> { Platforms: platforms, IsMandatory: this.$options.mandatory };
			let patchUpload = this.$server.tam.uploadPatch(this.$project.projectData.ProjectName, this.$project.projectData.ProjectName, patchData);
			this.$progressIndicator.showProgressIndicator(patchUpload, 2000).wait();

			this.$options.release = cachedOptionsRelease;

			this.openAppManagerStore();
		}).future<void>()();
	}

	private configureLivePatchPlugin(): IFuture<void> {
		return (() => {
			// Resolve pluginsService here as in its constructor it fails when project is not Cordova.
			let $pluginsService: IPluginsService = this.$injector.resolve("pluginsService");
			let plugins = $pluginsService.getInstalledPlugins();
			if(!_.some(plugins, plugin => plugin && plugin.data && plugin.data.Identifier === AppManagerService.LIVEPATCH_PLUGIN_ID)) {
				this.$logger.warn("The AppManager LiveSync plugin is not enabled for your project. Enabling it now for the release build configuration...");
				$pluginsService.addPlugin(AppManagerService.LIVEPATCH_PLUGIN_ID).wait();
				this.$logger.info("AppManager LiveSync is now enabled for the release build configuration.");
			}
		}).future<void>()();
	}

	private findGroups(identityStrings:string[]): IFuture<string[]> {
		return ((): string[] => {
			let availableGroups = this.$server.tam.getGroups().wait();

			if (!availableGroups.length) {
				this.$errors.failWithoutHelp("Cannot find distribution groups.");
			}

			return _.map(identityStrings, identityStr => {
				let group = helpers.findByNameOrIndex(identityStr, availableGroups, _group => _group.Name);

				if (!group) {
					this.$errors.failWithoutHelp ("Cannot find group that matches the provided <Group ID>: '%s'.To list the available groups, run $ appbuilder appmanager groups",
						identityStr,
						EOL);
				}

				return group.Id;
			});
		}).future<string[]>()();
	}
}
$injector.register("appManagerService", AppManagerService);

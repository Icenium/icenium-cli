import { TARGET_FRAMEWORK_IDENTIFIERS } from "../common/constants";

export class AppManagerLiveSyncCommand implements ICommand {
	private static ALL_PLATFORMS_OPTION = "All platforms";

	constructor(private $prompter: IPrompter,
		private $project: Project.IProject,
		private $mobileHelper: Mobile.IMobileHelper,
		private $appManagerService: IAppManagerService,
		private $errors: IErrors,
		private $logger:ILogger,
		private $config: Config.IConfig) { }

	public async execute(args: string[]): Promise<void> {
			let windowsPhonePlatformName = this.$mobileHelper.normalizePlatformName("WP8");
			let isNativeScript = this.$project.projectData.Framework === TARGET_FRAMEWORK_IDENTIFIERS.NativeScript;

			if(!args || args.length === 0) {
				let availablePlatforms = this.$config.ON_PREM || isNativeScript ? _.without(this.$mobileHelper.platformNames, windowsPhonePlatformName) : this.$mobileHelper.platformNames;
				let selectionOptions = availablePlatforms.concat(AppManagerLiveSyncCommand.ALL_PLATFORMS_OPTION);
				let selectedPlatform = this.$prompter.promptForChoice("This command will publish a new update version to AppManager. Please select platform?", selectionOptions).wait();
				if(selectedPlatform === AppManagerLiveSyncCommand.ALL_PLATFORMS_OPTION) {
					this.$appManagerService.publishLivePatch(availablePlatforms).wait();
				} else {
					this.$appManagerService.publishLivePatch([selectedPlatform]).wait();
				}
			} else {
				// make sure each platform is specified only once
				let platforms = _.keys(_.groupBy(args, arg => this.$mobileHelper.normalizePlatformName(arg)));
				if((this.$config.ON_PREM || isNativeScript) && _.includes(platforms, windowsPhonePlatformName)) {
					this.$errors.failWithoutHelp(`You cannot upload updates for Windows Phone.`);
				}
				this.$appManagerService.publishLivePatch(platforms).wait();
			}
	}

	public async canExecute(args: string[]): Promise<boolean> {
			_.each(args, platform => this.$mobileHelper.validatePlatformName(platform));
			return true;
	}

	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|livesync", AppManagerLiveSyncCommand);

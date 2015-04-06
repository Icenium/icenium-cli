///<reference path="../.d.ts"/>
"use strict";

export class AppManagerLiveSyncCommand implements ICommand {
	private static ALL_PLATFORMS_OPTION = "All platforms";

	constructor(private $prompter: IPrompter,
		private $mobileHelper: Mobile.IMobileHelper,
		private $appManagerService: IAppManagerService,
		private $errors: IErrors,
		private $logger:ILogger) { }

	public execute(args: string[]): IFuture<void> {
		return ((): void => {
			if(!args || args.length === 0) {
				var options = this.$mobileHelper.platformNames.concat(AppManagerLiveSyncCommand.ALL_PLATFORMS_OPTION);
				var selectedPlatform = this.$prompter.promptForChoice("This command will publish a new update version to AppManager. Please select platform?", options).wait();
				if(selectedPlatform === AppManagerLiveSyncCommand.ALL_PLATFORMS_OPTION) {
					this.$appManagerService.publishLivePatch(this.$mobileHelper.platformNames).wait();
				} else {
					this.$appManagerService.publishLivePatch([selectedPlatform]).wait();
				}
			} else {
				// make sure each platform is specified only once
				var platforms = _.keys(_.groupBy(args, arg => this.$mobileHelper.normalizePlatformName(arg)));
				this.$appManagerService.publishLivePatch(platforms).wait();
			}
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return ((): boolean => {
			_.each(args, platform => this.$mobileHelper.validatePlatformName(platform));
			return true;
		}).future<boolean>()();
	}

	public allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("appmanager|livesync", AppManagerLiveSyncCommand);

///<reference path="../../.d.ts"/>
"use strict";

export class PostInstallCommand implements ICommand {
	constructor(private $autoCompletionService: IAutoCompletionService,
		private $fs: IFileSystem,
		private $staticConfig: IStaticConfig) { }

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			if(process.platform !== "win32") {
				this.$fs.chmod(this.$staticConfig.adbFilePath, "0777").wait();
			}

			this.$autoCompletionService.enableAutoCompletion().wait();
		}).future<void>()();
	}
}
$injector.registerCommand("dev-post-install", PostInstallCommand);



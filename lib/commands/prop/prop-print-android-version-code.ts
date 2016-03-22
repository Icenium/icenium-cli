///<reference path="../../.d.ts"/>
"use strict";
import {PrintProjectCommand} from "./prop-print";

export class PrintAndroidVersionCodeCommand extends PrintProjectCommand implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector,
		protected $options: IOptions,
		private $logger: ILogger,
		private $projectConstants: IProjectConstants) {
		super($staticConfig, $injector, $options);
	}

	public execute(args:string[]): IFuture<void> {
		return ((): void => {
			super.execute(["AndroidVersionCode"]).wait();
			if (this.$project.projectData.Framework === this.$projectConstants.TARGET_FRAMEWORK_IDENTIFIERS.Cordova && !this.$options.validValue) {
				this.$logger.printMarkdown("Your final AndroidVersionCode will be `%s2` because Apache Cordova automatically appends a specific number to the version code based on the target Android SDK and architecture. For more information, see https://issues.apache.org/jira/browse/CB-8976.", this.$project.projectData.AndroidVersionCode);
			}

		}).future<void>()();
	}

	allowedParameters:ICommandParameter[] = [];
}
$injector.registerCommand("prop|print|androidversioncode", PrintAndroidVersionCodeCommand);

import {SetProjectPropertyCommand} from "./prop-set";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../common/constants";

export class SetAndroidVersionCodeCommand extends SetProjectPropertyCommand implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector,
		private $logger: ILogger) {
		super($staticConfig, $injector);
	}

	canExecute(args: string[]): IFuture<boolean> {
		return this.$project.validateProjectProperty("AndroidVersionCode", args, "set");
	}

	public async execute(args: string[]): Promise<void> {
			await super.execute(["AndroidVersionCode", args[0]]);
			if (this.$project.projectData.Framework === TARGET_FRAMEWORK_IDENTIFIERS.Cordova) {
				this.$logger.printMarkdown("Your final AndroidVersionCode will be `%s2` because Apache Cordova automatically appends a specific number to the version code based on the target Android SDK and architecture. For more information, see https://issues.apache.org/jira/browse/CB-8976.", args[0]);
			}
	}
}
$injector.registerCommand("prop|set|androidversioncode", SetAndroidVersionCodeCommand);

import { SetProjectPropertyCommand } from "./prop-set";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../common/constants";
import { invokeInit } from "../../common/decorators";

export class SetAndroidVersionCodeCommand extends SetProjectPropertyCommand implements ICommand {
	constructor($staticConfig: IStaticConfig,
		$injector: IInjector,
		private $logger: ILogger) {
		super($staticConfig, $injector);
	}

	@invokeInit()
	public async canExecute(args: string[]): Promise<boolean> {
		return this.$project.validateProjectProperty("AndroidVersionCode", args, "set");
	}

	@invokeInit()
	public async execute(args: string[]): Promise<void> {
		await super.execute(["AndroidVersionCode", args[0]]);
		if (this.$project.projectData.Framework === TARGET_FRAMEWORK_IDENTIFIERS.Cordova) {
			let message = "Your final AndroidVersionCode will be `%s2` because Apache Cordova automatically appends a specific number to the version code based on the target Android SDK and architecture. For more information, see https://issues.apache.org/jira/browse/CB-8976.";
			this.$logger.printMarkdown(message, args[0]);
		}
	}
}

$injector.registerCommand("prop|set|androidversioncode", SetAndroidVersionCodeCommand);

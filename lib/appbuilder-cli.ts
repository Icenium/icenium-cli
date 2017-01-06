require("./bootstrap");
import * as shelljs from "shelljs";
shelljs.config.silent = true;
import { installUncaughtExceptionListener } from "./common/errors";
installUncaughtExceptionListener(process.exit);

(async () => {
	let commandDispatcher: ICommandDispatcher = $injector.resolve("commandDispatcher");

	// let config: Config.IConfig = $injector.resolve("$config");
	// let errors: IErrors = $injector.resolve("$errors");
	// errors.printCallStack = config.DEBUG;

	// let messages = <IMessagesService>$injector.resolve("$messagesService");
	// messages.pathsToMessageJsonFiles = [/* Place client-specific json message file paths here */];

	if (process.argv[2] === "completion") {
		await commandDispatcher.completeCommand();
	} else {
		await commandDispatcher.dispatchCommand();
	}

	$injector.dispose();
})();

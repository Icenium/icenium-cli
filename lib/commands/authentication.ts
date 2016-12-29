export class LoginCommand implements ICommand {
	constructor(private $loginManager: ILoginManager) { }

	async execute(args: string[]): Promise<void> {
		return this.$loginManager.login();
	}

	allowedParameters: ICommandParameter[] = [];
	disableAnalytics = true;
}
$injector.registerCommand("login", LoginCommand);

export class LogoutCommand implements ICommand {
	constructor(private $loginManager: ILoginManager) { }
	async execute(args: string[]): Promise<void> {
		return this.$loginManager.logout();
	}

	allowedParameters: ICommandParameter[] = [];
	disableAnalytics = true;
}
$injector.registerCommand("logout", LogoutCommand);

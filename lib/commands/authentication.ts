export class LoginCommand implements ICommand {
	constructor(private $loginManager: ILoginManager) { }

	public async execute(args: string[]): Promise<void> {
		await this.$loginManager.login();
	}

	public allowedParameters: ICommandParameter[] = [];
	public disableAnalytics = true;
}

$injector.registerCommand("login", LoginCommand);

export class LogoutCommand implements ICommand {
	constructor(private $loginManager: ILoginManager) { }
	public async execute(args: string[]): Promise<void> {
		await this.$loginManager.logout();
	}

	public allowedParameters: ICommandParameter[] = [];
	public disableAnalytics = true;
}

$injector.registerCommand("logout", LogoutCommand);

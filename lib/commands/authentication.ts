///<reference path="../.d.ts"/>

"use strict";

import commandParams = require("../common/command-params");

export class LoginCommand implements ICommand {
	constructor(private $loginManager: ILoginManager) { }

	execute(args: string[]): IFuture<void> {
		return this.$loginManager.login();
	}

	allowedParameters: ICommandParameter[] = [];
	disableAnalytics = true;
}
$injector.registerCommand("login", LoginCommand);

export class LogoutCommand implements ICommand {
	constructor(private $loginManager: ILoginManager) { }
	execute(args: string[]): IFuture<void> {
		return this.$loginManager.logout();
	}

	allowedParameters: ICommandParameter[] = [];
	disableAnalytics = true;
}
$injector.registerCommand("logout", LogoutCommand);

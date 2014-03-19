///<reference path="../.d.ts"/>

"use strict";

import util = require("util");

export class UserStatusCommand implements ICommand {
	constructor(private $userDataStore: IUserDataStore,
		private $logger: ILogger,
		private $config: IConfiguration) {}

	public execute(args:string[]): IFuture<void> {
		return (() => {
			var user = this.$userDataStore.getUser().wait();

			var fields = {
				"Name": user.name,
				"E-mail": user.email
			};

			if (user.tenant) {
				fields["License"] = util.format("Telerik AppBuilder %s Edition (%s)", user.tenant.edition, user.tenant.license);
				var expires = new Date(Date.parse(user.tenant.expSoft));
				fields["License expires"] = expires.toLocaleDateString();
				fields["Licensed by"] = user.tenant.name;
			}

			var fieldNames = Object.keys(fields);
			var maxPrefixLength = _.max(fieldNames, (name) => name.length).length;
			fieldNames.forEach((field) => {
				var padding = _.range(maxPrefixLength - field.length).map((x) => " ").join("");
				this.$logger.out("%s%s: %s", padding, field, fields[field]);
			});
			this.$logger.out("\nView your account at %s://%s/account/subscription", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
		}).future<void>()();
	}
}

$injector.registerCommand("user", UserStatusCommand);
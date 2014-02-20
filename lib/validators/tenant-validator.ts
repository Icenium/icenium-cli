///<reference path="../.d.ts"/>

"use strict";
import util = require("util");

export class TenantValidator implements ITenantValidator {

	constructor(private $logger: ILogger,
		private $config: IConfiguration,
		private $userDataStore: IUserDataStore) { }

	private isSubscriptionExpired(): IFuture<boolean> {
		return(() => {
			var user = this.$userDataStore.getUser().wait();
			return Date.parse(user.tenant.expSoft) < new Date().getTime();
		}).future<boolean>()();
	}

	public executeCommandIfAuthorized(requiresActiveAccount: boolean, action: Function): void {
		if(requiresActiveAccount) {
			if(this.isSubscriptionExpired().wait()) {
				var subscriptionUrl = util.format("%s://%s/account/subscription", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
				this.$logger.out("Your subscription has expired. Click %s [Ctrl-Click] to manage your subscription. Note: After you renew your subscription, " +
					"log out and log back in for the changes to take effect.", subscriptionUrl);
			} else {
				action();
			}
		} else  {
			action();
		}
	}
}

$injector.register("tenantValidator", TenantValidator);

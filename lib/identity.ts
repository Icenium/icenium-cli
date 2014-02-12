///<reference path=".d.ts"/>

"use strict";

var options:any = require("./options");
import util = require("util");
import helpers = require("./helpers");

export class IdentityManager implements Server.IIdentityManager {
	constructor(private $server: Server.IServer,
		private $logger: ILogger,
		private $errors: IErrors) {}

	public listCertificates(): IFuture<any> {
		return ((): any => {
			var data = this.$server.identityStore.getIdentities().wait();

			for (var i = 0; i < data.length; i++) {
				var ident = data[i];
				this.$logger.out(util.format("#%d: '%s'", i + 1, ident.Alias));
			}

			if (!data.length) {
				this.$logger.info("No certificates registered."); // TODO: add guidance how to install certificates (when that becomes possible)
			}
		}).future<any>()();
	}

	public listProvisions(): IFuture<any> {
		return ((): any => {
			var data = this.$server.mobileprovisions.getProvisions().wait();

			for (var i = 0; i < data.length; i++) {
				var provision = data[i];

				this.$logger.out(util.format("#%d: '%s'; type: %s, App ID: '%s.%s'", i + 1, provision.Name, provision.ProvisionType,
					provision.ApplicationIdentifierPrefix, provision.ApplicationIdentifier));
				if (options.verbose) {
					this.$logger.out("  Provisioned devices:");
					var devices = provision.ProvisionedDevices.$values;
					for (var di = 0; di < devices.length; di++) {
						this.$logger.out("    " + devices[di]);
					}
				}
			}

			if (!data.length) {
				this.$logger.info("No mobile provisioning profiles registered."); // TODO: add guidance how to install provisions (when that becomes possible)
			}
		}).future<any>()();
	}

	private findIdentityData(identityStr, data, selector): any {
		if (!identityStr) {
			return undefined;
		}

		for (var i = 0; i < data.length; i++) {
			var identData = data[i];

			if (identityStr === selector(identData)) {
				return identData;
			}
		}

		var index = parseInt(identityStr, 10) - 1;
		if (index >= 0 && index < data.length) {
			return data[index];
		}
	}

	public findCertificate(identityStr): IFuture<any> {
		return ((): any => {
			this.$logger.debug("Looking for certificate '%s'", identityStr);
			var identities = this.$server.identityStore.getIdentities().wait();

			var result = this.findIdentityData(identityStr, identities, (ident) => ident.Alias);
			if (!result) {
				this.$errors.fail({formatStr: "Could not find certificate named '%s' or was not given a valid index. List registered certificates with 'list-certificates' command.",
					suppressCommandHelp: true }, identityStr);
			} else {
				return result;
			}
		}).future<any>()();
	}

	public findProvision(provisionStr): IFuture<any> {
		return ((): any => {
			this.$logger.debug("Looking for provision '%s'", provisionStr);
			var provisions = this.$server.mobileprovisions.getProvisions().wait();
			var result = this.findIdentityData(provisionStr, provisions, (ident) => ident.Name);

			if (!result) {
				this.$errors.fail({formatStr: "Could not find provision named '%s' or was not given a valid index. List registered provisions with 'list-provisions' command.",
					suppressCommandHelp: true }, provisionStr);
			} else {
				return result;
			}
		}).future<any>()();
	}
}
$injector.register("identityManager", IdentityManager);
helpers.registerCommand("identityManager", "list-certificates", (identityManager, args) => identityManager.listCertificates());
helpers.registerCommand("identityManager", "list-provisions", (identityManager, args) => identityManager.listProvisions());

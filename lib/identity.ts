///<reference path=".d.ts"/>

"use strict";

var options:any = require("./options");
import log = require("./logger");
import util = require("util");

export class IdentityManager implements Server.IIdentityManager {
	constructor(private $server: Server.IServer) {
	}

	public listCertificates(): void {
		var data = this.$server.identityStore.getIdentities().wait();

		for (var i = 0; i < data.length; i++) {
			var ident = data[i];
			console.log(util.format("#%d: '%s'", i + 1, ident.Alias));
		}
	}

	public listProvisions(): void {
		var data = this.$server.mobileprovisions.getProvisions().wait();

		for (var i = 0; i < data.length; i++) {
			var provision = data[i];

			console.log(util.format("#%d: '%s'; type: %s, App ID: '%s.%s'", i + 1, provision.Name, provision.ProvisionType,
				provision.ApplicationIdentifierPrefix, provision.ApplicationIdentifier));
			if (options.verbose) {
				console.log("  Provisioned devices:");
				var devices = provision.ProvisionedDevices.$values;
				for (var di = 0; di < devices.length; di++) {
					console.log("    " + devices[di]);
				}
			}
		}
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
			log.debug("Looking for certificate '%s'", identityStr);
			var identities = this.$server.identityStore.getIdentities().wait();

			var result = this.findIdentityData(identityStr, identities, (ident) => ident.Alias);
			if (!result) {
				throw new Error(util.format("Could not find certificate named '%s' or was not given a valid index. List registered certificates with 'list-certificates' command.", identityStr));
			} else {
				return result;
			}
		}).future<any>()();
	}

	public findProvision(provisionStr): IFuture<any> {
		return ((): any => {
			log.debug("Looking for provision '%s'", provisionStr);
			var provisions = this.$server.mobileprovisions.getProvisions().wait();
			var result = this.findIdentityData(provisionStr, provisions, (ident) => ident.Name);

			if (!result) {
				throw new Error(util.format("Could not find provision named '%s' or was not given a valid index. List registered provisions with 'list-provisions' command.", provisionStr));
			} else {
				return result;
			}
		}).future<any>()();
	}
}
$injector.register("identityManager", IdentityManager);
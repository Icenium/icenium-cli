///<reference path="../.d.ts"/>

"use strict";

import _ = require("underscore");
import Future = require("fibers/future");

class Provision implements IProvision {
	constructor(private provisionData: any) { }

	public get Name(): string {
		return this.provisionData.Name;
	}

	public get Identifier(): string {
		return this.provisionData.Identifier;
	}

	public get ApplicationIdentifierPrefix(): string {
		return this.provisionData.ApplicationIdentifierPrefix;
	}

	public get ApplicationIdentifier(): string {
		return this.provisionData.ApplicationIdentifier;
	}

	public get ProvisionType(): string {
		return this.provisionData.ProvisionType;
	}

	public get ExpirationDate() {
		return this.provisionData.ExpirationDate;
	}

	public get Certificates(): ICryptographicIdentity[] {
		return this.provisionData.Certificates;
	}

	public get ProvisionedDevices(): string[] {
		return this.provisionData.ProvisionedDevices;
	}
}

class CryptographicIdentity implements ICryptographicIdentity{
	constructor(private identityData) { }

	public get Alias(): string {
		return this.identityData.Alias;
	}

	public get Attributes(): string[] {
		return this.identityData.Attributes;
	}

	public get Type(): string {
		return this.identityData.$type;
	}

	public get Certificate() {
		return this.identityData.Certificate;
	}
}

export class CryptographicIdentityStoreService implements ICryptographicIdentityStoreService{
	constructor(private $server: Server.IServer) { }

	public getAllProvisions(): IFuture<IProvision[]> {
		return(() => {
			var data = this.$server.mobileprovisions.getProvisions().wait();
			return _.map(data, (identityData) => new Provision(identityData));
		}).future<IProvision[]>()();
	}

	public getAllIdentities(): IFuture<ICryptographicIdentity[]> {
		return(() => {
			var data = this.$server.identityStore.getIdentities().wait();
			return _.map(data, (identityData) => new CryptographicIdentity(identityData));
		}).future<ICryptographicIdentity[]>()();
	}
}
$injector.register("cryptographicIdentityStoreService", CryptographicIdentityStoreService);

///<reference path="../.d.ts"/>

"use strict";

import _ = require("underscore");
import CryptographicIdentity = require("./cryptographic-identity");
import Provision = require("./provision");

//TODO: _bridge_ remove after refactoring
function getServer(): Server.IServer {
	return $injector.resolve("server");
}

function CryptographicIdentityStoreService() {

}

CryptographicIdentityStoreService.prototype.getAllProvisions = function(callback) {
	var data = getServer().mobileprovisions.getProvisions().wait();
	var provisions = _.map(data, (provisionData) => new Provision(provisionData));
	callback(null, provisions);
};

CryptographicIdentityStoreService.prototype.getAllIdentities = function(callback) {
	var data = getServer().identityStore.getIdentities().wait();
	var identities = _.map(data, (identityData) => new CryptographicIdentity(identityData));
	callback(null, identities);
};

var service = new CryptographicIdentityStoreService();
export = service;

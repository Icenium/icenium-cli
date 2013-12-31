///<reference path="../.d.ts"/>

"use strict";

import server = require("./../server");
import Q = require("q");
import _ = require("underscore");
import CryptographicIdentity = require("./cryptographic-identity");
import Provision = require("./provision");

function CryptographicIdentityStoreService() {

}

CryptographicIdentityStoreService.prototype.getAllProvisions = function(callback) {
	server.getProvisions(function(error, data) {
		if(error) {
			throw error;
		}

		var provisions = _.map(data, function(provisionData){
			return new Provision(provisionData);
		});

		callback(error, provisions);
	});
};

CryptographicIdentityStoreService.prototype.getAllIdentities = function(callback) {
	server.getIdentities(function(error, data){
		if(error) {
			throw error;
		}

		var identities = _.map(data, function(identityData){
			return new CryptographicIdentity(identityData);
		});

		callback(error, identities);
	});
};

var service = new CryptographicIdentityStoreService();
export = service;

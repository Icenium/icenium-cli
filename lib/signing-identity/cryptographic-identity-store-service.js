"use strict";

var server = require("./../server"),
	Q = require("Q"),
	_ = require("underscore"),
	CryptographicIdentity = require("./cryptographic-identity"),
	Provision = require("./provision");

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

module.exports = new CryptographicIdentityStoreService();
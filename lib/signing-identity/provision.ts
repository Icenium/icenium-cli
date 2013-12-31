///<reference path="../.d.ts"/>

"use strict";

function Provision(provisionData) {
	var _provisionData = provisionData;
	Object.defineProperty(this, "provisionData", {
		get: function() {
			return _provisionData ;
		},
		set: function(newValue) {
			_provisionData = newValue;
		}
	});
}

Provision.prototype.getName = function() {
	return this.provisionData.Name;
};

Provision.prototype.getIdentifier = function() {
	return this.provisionData.Identifier;
};

Provision.prototype.getApplicationIdentifierPrefix = function() {
	return this.provisionData.ApplicationIdentifierPrefix;
};

Provision.prototype.getApplicationIdentifier = function() {
	return this.provisionData.ApplicationIdentifier;
};

Provision.prototype.getProvisionType = function() {
	return this.provisionData.ProvisionType;
};

Provision.prototype.getExpirationDate = function() {
	return this.provisionData.ExpirationDate;
};

Provision.prototype.getCertificates = function() {
	return this.provisionData.Certificates.$values;
};

Provision.prototype.getProvisionedDevices = function() {
	return this.provisionData.ProvisionedDevices.$values;
};

export  = Provision;

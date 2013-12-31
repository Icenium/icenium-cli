///<reference path="../.d.ts"/>

"use strict";

function CryptographicIdentity(identityData) {
	var identity = identityData;
	Object.defineProperty(this, "identityData", {
		get: function() {
			return identity;
		},
		set: function(newValue) {
			identity = newValue;
		}
	});
}

CryptographicIdentity.prototype.getAlias = function() {
	return this.identityData.Alias;
};

CryptographicIdentity.prototype.getAttributes = function() {
	return this.identityData.Attributes;
};

CryptographicIdentity.prototype.getType = function() {
	return this.identityData.$type;
};

CryptographicIdentity.prototype.getCertificate = function() {
	return this.identityData.Certificate;
};

export = CryptographicIdentity;

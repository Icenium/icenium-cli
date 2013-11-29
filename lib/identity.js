"use strict";

(function() {
	var server = require("./server"),
		options = require("./options"),
		log = require("./log"),
		util = require("util");

	function listCertificates() {
		server.getIdentities(function(error, data) {
			if (error) {
				throw error;
			}

			for (var i = 0; i < data.length; i++) {
				var ident = data[i];
				console.log(util.format("#%d: '%s'", i + 1, ident.Alias));
			}
		});
	}

	function listProvisions() {
		server.getProvisions(function(error, data) {
			if (error) {
				throw error;
			}

			for (var i = 0; i < data.length; i++) {
				var provision = data[i];

				console.log(util.format("#%d: '%s', App ID: '%s.%s'", i + 1, provision.Name, provision.ApplicationIdentifierPrefix, provision.ApplicationIdentifier));
				if (options.verbose) {
					console.log("  Provisioned devices:");
					var devices = provision.ProvisionedDevices.$values;
					for (var di = 0; di < devices.length; di++) {
						console.log("    " + devices[di]);
					}
				}
			}
		});
	}

	function findIdentityData(errorStr, identityStr, callback, dataSourceFunc, selector) {
		if (!identityStr) {
			callback(new Error(errorStr));
			return;
		}

		dataSourceFunc.call(null, function(err, data) {
			if (err) {
				callback(err);
			}

			for (var i = 0; i < data.length; i++) {
				var identData = data[i];

				if (identityStr === selector(identData)) {
					callback(null, identData);
					return;
				}
			}

			var index = parseInt(identityStr, 10) - 1;
			if (index >= 0 && index < data.length) {
				callback(null, data[index]);
				return;
			}

			callback(new Error(errorStr));
		});
	}

	function findCertificate(identityStr, callback) {
		log.debug("Looking for certificate '%s'", identityStr);
		findIdentityData(util.format("Could not find certificate named '%s' or was not given a valid index. List registered certificates with 'list-certificates' command.", identityStr),
			identityStr, callback, server.getIdentities,
			function(ident) {
				return ident.Alias;
			});
	}

	function findProvision(provisionStr, callback) {
		log.debug("Looking for provision '%s'", provisionStr);
		findIdentityData(util.format("Could not find provision named '%s' or was not given a valid index. List registered provisions with 'list-provisions' command.", provisionStr),
			provisionStr, callback, server.getProvisions,
			function(ident) {
				return ident.Name;
			});
	}

	exports.listCertificates = listCertificates;
	exports.listProvisions = listProvisions;
	exports.findCertificate = findCertificate;
	exports.findProvision = findProvision;
})();

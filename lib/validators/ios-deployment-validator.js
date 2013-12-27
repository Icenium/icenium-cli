(function(){
	"use strict";
	var ValidationResult = require("./validation-result"),
		CryptographicIdentityStoreService = require("./../signing-identity/cryptographic-identity-store-service"),
		helpers = require("./../helpers"),
		util = require("util"),
		_ = require("underscore");

	var missingProvisionErrorMessage = "No provisioning profile found.",
		expiredProvisionErrorMessage = "Provisioning profile is expired.",
		applicationIdentifierMismatch = "The application identifier must match the bundle identifier in the provisioning profile.",
		missingCertificateErrorMessage = "Certificate is missing.",
		expiredCertificateErrorMessage = "Certificate is expired.",
		notFoundProvisionErrorMessage = "Could not find provision with name or starting with name '%s'. List registered provisions with 'list-provisions' command",
		notSpecifiedProvisionErrorMessage = "Please specify the provisioning profile (with option --provision) that should be used when building the project.",
		notFoundCertificateErrorMessage = "Could not find valid certificates for provision '%s'";

	function IOSDeploymentValidator(appIdentifier) {
		var _appIdentifier = appIdentifier;

		Object.defineProperty(this, "AppIdentifier", {
			get: function() {
				return _appIdentifier;
			},
			set: function(value) {
				_appIdentifier = value;
			}
		});
	}

	IOSDeploymentValidator.prototype.validateCodeSigningProfile = function(provisionStr, callback) {
		if(helpers.isStringOptionEmpty(provisionStr)) {
			throw notSpecifiedProvisionErrorMessage;
		}

		CryptographicIdentityStoreService.getAllProvisions(function(error, provisions){
			var provision = _.first(_.filter(provisions, function(provision){
				return provision.getName().indexOf(provisionStr) !== -1;
			}));

			if(provision === undefined) {
				throw util.format(notFoundProvisionErrorMessage, provisionStr);
			}

			var provisionValidationResult = validateProvision(provision);
			if(!provisionValidationResult.IsSuccessful) {
				throw provisionValidationResult.Error;
			}

			var certificate = _.first(_.filter(provision.getCertificates(), function(c){
				return validateCertificate(provision, c).IsSuccessful;
			}));

			if(certificate === undefined) {
				throw util.format(notFoundCertificateErrorMessage, provision);
			}

			callback(error, {
				provision: provision,
				certificate: certificate
			});
		});
	};

	function validateProvision(provision) {
		var errorMessage = null;
		if(provision === null) {
			return new ValidationResult(missingProvisionErrorMessage);
		}
		if(Date.parse(provision.getExpirationDate()) <= Date.parse(new Date().toUTCString())) {
			return new ValidationResult(expiredProvisionErrorMessage);
		}
		if(provision.getApplicationIdentifier() !== "*") {
			var provisionIdentifierPattern = getRegexPattern(provision.getApplicationIdentifier());

			if(!this.AppIdentifier.match(provisionIdentifierPattern)) {
				return new ValidationResult(applicationIdentifierMismatch);
			}
		}

		return new ValidationResult(null);
	}

	function validateCertificate(provision, certificate) {
		if(certificate === null) {
			return new ValidationResult(missingCertificateErrorMessage);
		}
		if(!_.some(provision.getCertificates(), function(c) { return c === certificate;})) {
			return new ValidationResult(missingCertificateErrorMessage);
		}

		return new ValidationResult(null);
	}

	function getRegexPattern(appIdentifier) {
		var starPlaceholder = "<!StarPlaceholder!>";
		var escapedIdentifier = RegExp.escape(appIdentifier.replace("*", starPlaceholder)).replace(starPlaceholder, ".*");
		return "^" + escapedIdentifier + "$";
	}

	module.exports = IOSDeploymentValidator;

})();

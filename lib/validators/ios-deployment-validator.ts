///<reference path="../.d.ts"/>

"use strict";

import ValidationResult = require("./validation-result");
import CryptographicIdentityStoreService = require("./../signing-identity/cryptographic-identity-store-service");
import Future = require("fibers/future");
import helpers = require("./../helpers");
import util = require("util");
import _ = require("underscore");

export class IOSDeploymentValidator {
	private static MISSING_PROVISION_ERROR_MESSAGE = "No provisioning profile found.";
	private static EXPIRED_PROVISON_ERROR_MESSAGE = "Provisioning profile is expired.";
	private static APPLICATION_IDENTIFIER_MISMATCH = "The application identifier must match the bundle identifier in the provisioning profile.";
	private static MISSING_CERTIFICATE_ERROR_MESSAGE = "Certificate is missing.";
	private static EXPIRED_CERTIFICATE_ERROR_MESSAGE = "Certificate is expired.";
	private static NOT_FOUND_PROVISION_ERROR_MESSAGE = "Could not find provision with name or starting with name '%s'. List registered provisions with 'list-provisions' command";
	private static NOT_SPECIFIER_PROVISION_ERROR_MESSAGE = "Please specify the provisioning profile (with option --provision) that should be used when building the project.";
	private static NOT_FOUND_CERTIFICATE_ERROR_MESSAGE = "Could not find valid certificates for provision '%s'";

	constructor(private appIdentifier: string,
		private $cryptographicIdentityStoreService: ICryptographicIdentityStoreService) { }

	validateCodeSigningProfile(provisionStr: string) : IFuture<IValidationResult> {
		return(() => {
			if(helpers.isStringOptionEmpty(provisionStr)) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_SPECIFIER_PROVISION_ERROR_MESSAGE);
			}
			var provisions = this.$cryptographicIdentityStoreService.getAllProvisions().wait();
			var provision = _.find(provisions, (currentProvision) => { return currentProvision.Name.indexOf(provisionStr) !== -1; });

			var provisionValidationResult = this.validateProvision(provision);
			if(!provisionValidationResult.IsSuccessful) {
				return provisionValidationResult;
			}

			var certificate = _.find(provision.Certificates, (cer) => { return this.validateCertificate(provision, cer).IsSuccessful; });
			if(!certificate) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_CERTIFICATE_ERROR_MESSAGE);
			}

			return new ValidationResult.ValidationResult(null);
		}).future<IValidationResult>()();
	}

	private validateProvision(provision: IProvision):IValidationResult {
		if(!provision) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.NOT_FOUND_PROVISION_ERROR_MESSAGE);
		}
		if(provision === null) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.MISSING_PROVISION_ERROR_MESSAGE);
		}
		if(Date.parse(provision.ExpirationDate) <= Date.parse(new Date().toUTCString())) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.EXPIRED_PROVISON_ERROR_MESSAGE);
		}
		if(provision.ApplicationIdentifier !== "*") {
			var provisionIdentifierPattern = new RegExp(this.getRegexPattern(provision.ApplicationIdentifier));
			if(!provisionIdentifierPattern.test(this.appIdentifier)) {
				return new ValidationResult.ValidationResult(IOSDeploymentValidator.APPLICATION_IDENTIFIER_MISMATCH);
			}
		}

		return new ValidationResult.ValidationResult(null);
	}

	private validateCertificate(provision: IProvision, certificate: ICryptographicIdentity): IValidationResult {
		if(certificate === null) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.MISSING_CERTIFICATE_ERROR_MESSAGE);
		}
		if(!_.find(provision.Certificates, (c) => { return c === certificate; })) {
			return new ValidationResult.ValidationResult(IOSDeploymentValidator.MISSING_CERTIFICATE_ERROR_MESSAGE);
		}

		return new ValidationResult.ValidationResult(null);
	}

	private getRegexPattern(appIdentifier) {
		var starPlaceholder = "<!StarPlaceholder!>";
		var escapedIdentifier = (<any>RegExp).escape(appIdentifier.replace("*", starPlaceholder)).replace(starPlaceholder, ".*");
		return "^" + escapedIdentifier + "$";
	}
}

